import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Keyboard,
} from "lucide-react";
import { eventsApi, scannerApi } from "@/api";
import { ErrorState, ForbiddenState, LoadingState, Panel, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDateTime } from "@/lib/format";
import { pageHead } from "@/lib/nav";
export const Route = createFileRoute("/_authenticated/events/$eventId/scanner")({
  head: () => pageHead("Ticket scanner", "Check in attendees by scanning their event tickets."),
  component: ScannerPage,
});
function extractTicketCode(text) {
  const t = text.trim();
  try {
    const j = JSON.parse(t);
    if (j?.ticketCode) return String(j.ticketCode);
  } catch {
    /* plain text */
  }
  return t;
}
function ScannerPage() {
  const { eventId } = Route.useParams();
  const access = useQuery({
    queryKey: ["scanner-access", eventId],
    queryFn: () => scannerApi.getAccess(eventId),
    retry: false,
  });
  const allowed = access.data?.allowed === true;
  const event = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => eventsApi.getEvent(eventId),
    enabled: allowed,
  });
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState("");
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const scannerRef = useRef(null);
  const lockRef = useRef(false);
  async function checkIn(raw) {
    const code = extractTicketCode(raw);
    if (!code || lockRef.current) return;
    lockRef.current = true;
    setBusy(true);
    const at = new Date().toISOString();
    let r;
    try {
      const data = await scannerApi.checkIn(eventId, code);
      r = { kind: "success", data, code, at };
    } catch (e) {
      const err = e;
      r =
        err.status === 409
          ? { kind: "duplicate", message: "Ticket Already Checked In", code, at }
          : { kind: "error", message: err.message, code, at, trace: err.traceId };
    }
    setResult(r);
    setRecent((p) => [r, ...p].slice(0, 10));
    setBusy(false);
    setTimeout(() => {
      lockRef.current = false;
    }, 1500);
  }
  async function start() {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const s = new Html5Qrcode("qr-reader");
      scannerRef.current = s;
      await s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => void checkIn(text),
        () => {},
      );
      setRunning(true);
    } catch {
      setResult({
        kind: "error",
        message: "Camera unavailable. Allow camera access or enter the ticket code manually.",
        code: "—",
        at: new Date().toISOString(),
      });
    }
  }
  async function stop() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
    setRunning(false);
  }
  useEffect(
    () => () => {
      void stop();
    },
    [],
  );
  if (access.isLoading) return <LoadingState rows={2} label="Checking scanner access" />;
  if (access.error) {
    const e = access.error;
    if (e.status === 403)
      return <ForbiddenState message="You are not authorized to scan tickets for this event." />;
    return <ErrorState error={e} onRetry={() => access.refetch()} />;
  }
  if (!allowed)
    return <ForbiddenState message="You are not authorized to scan tickets for this event." />;
  const ev = event.data ?? access.data?.event;
  return (
    <>
      <Link
        to="/my-tasks"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> My tasks
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{ev?.title ?? "Event"}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-success">
            <ShieldCheck className="h-4 w-4" /> Scanner authorized for this event
          </p>
        </div>
        {running ? (
          <Button variant="outline" onClick={() => void stop()}>
            <CameraOff className="mr-2 h-4 w-4" /> Stop Scanner
          </Button>
        ) : (
          <Button onClick={() => void start()}>
            <Camera className="mr-2 h-4 w-4" /> Start Scanner
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-sidebar">
            <div id="qr-reader" className="aspect-square w-full [&_video]:object-cover" />
            {!running && (
              <div className="-mt-[100%] grid aspect-square place-items-center text-sidebar-foreground/70">
                <div className="text-center">
                  <Camera className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">Camera is off</p>
                </div>
              </div>
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void checkIn(manual);
              setManual("");
            }}
          >
            <label htmlFor="manual-code" className="sr-only">
              Ticket code
            </label>
            <div className="relative flex-1">
              <Keyboard
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="manual-code"
                className="pl-9 font-mono uppercase"
                placeholder="Enter ticket code"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!manual.trim() || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Check in
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div aria-live="polite">
            {!result ? (
              <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                Scan a ticket to see the result here.
              </div>
            ) : result.kind === "success" ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-6">
                <p className="flex items-center gap-2 font-display text-xl font-semibold text-success">
                  <CheckCircle2 className="h-6 w-6" /> Ticket Verified
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <dt className="text-muted-foreground">Attendee</dt>
                  <dd className="font-semibold">
                    {result.data?.attendeeName ?? result.data?.attendee?.fullName ?? "—"}
                  </dd>
                  <dt className="text-muted-foreground">Event</dt>
                  <dd>{result.data?.eventTitle ?? result.data?.event?.title ?? ev?.title}</dd>
                  <dt className="text-muted-foreground">Ticket</dt>
                  <dd className="font-mono">
                    {result.data?.ticketCode ?? result.data?.ticket?.ticketCode ?? result.code}
                  </dd>
                  <dt className="text-muted-foreground">Scanned at</dt>
                  <dd>{fmtDateTime(result.data?.scannedAt ?? result.at)}</dd>
                </dl>
              </div>
            ) : result.kind === "duplicate" ? (
              <div className="rounded-xl border border-warning/30 bg-warning/10 p-6">
                <p className="flex items-center gap-2 font-display text-xl font-semibold text-warning">
                  <AlertTriangle className="h-6 w-6" /> Ticket Already Checked In
                </p>
                <p className="mt-2 font-mono text-sm">{result.code}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
                <p className="flex items-center gap-2 font-display text-xl font-semibold text-destructive">
                  <XCircle className="h-6 w-6" /> Check-in failed
                </p>
                <p className="mt-2 text-sm">{result.message}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {result.code}
                  {result.trace ? ` · Trace ID: ${result.trace}` : ""}
                </p>
              </div>
            )}
          </div>
          <Panel title="Recent scans">
            {!recent.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No scans yet this session.
              </p>
            ) : (
              <ul className="divide-y">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="font-mono">{r.code}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {new Date(r.at).toLocaleTimeString()}
                      <StatusBadge
                        tone={
                          r.kind === "success"
                            ? "success"
                            : r.kind === "duplicate"
                              ? "warning"
                              : "danger"
                        }
                        label={
                          r.kind === "success"
                            ? "Verified"
                            : r.kind === "duplicate"
                              ? "Duplicate"
                              : "Rejected"
                        }
                      />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
