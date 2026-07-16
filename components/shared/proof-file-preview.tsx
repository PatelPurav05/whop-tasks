import {
  ArrowUpRightFromSquare20,
  Document20,
  Download20,
} from "@frosted-ui/icons";
import { Badge, Button } from "@whop/react/components";
import Link from "next/link";
import { formatFileSize } from "@/components/shared/format";

type ProofFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") {
    return "PDF document";
  }
  if (mimeType === "image/png") {
    return "PNG image";
  }
  if (mimeType === "image/jpeg") {
    return "JPEG image";
  }
  return "Attachment";
}

export function ProofFilePreview({ file }: { file: ProofFile }) {
  const downloadUrl = `/api/files/${file.id}`;
  const previewUrl = `${downloadUrl}?inline=1`;
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const hasPreview = isImage || isPdf;
  const headerId = `proof-file-${file.id}`;

  return (
    <figure
      aria-labelledby={headerId}
      className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"
    >
      <figcaption
        id={headerId}
        className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted)]">
            <Document20 aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] leading-[18px] font-medium">
              {file.name}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge color="gray" variant="soft" size="1">
                {getFileTypeLabel(file.mimeType)}
              </Badge>
              <span className="text-[12px] leading-[15px] text-[var(--muted)] tabular-nums">
                {formatFileSize(file.sizeBytes)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {hasPreview ? (
            <Button asChild variant="soft" color="gray" size="2">
              <Link href={previewUrl} target="_blank" rel="noreferrer">
                <ArrowUpRightFromSquare20 aria-hidden="true" />
                Open
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="surface" color="gray" size="2">
            <Link href={downloadUrl} target="_blank" rel="noreferrer">
              <Download20 aria-hidden="true" />
              Download
            </Link>
          </Button>
        </div>
      </figcaption>

      {isImage ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface-subtle)] p-4">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open full-size preview of ${file.name}`}
            className="block rounded-lg motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.25,1,0.5,1)] motion-safe:hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={file.name}
              loading="lazy"
              decoding="async"
              className="mx-auto max-h-64 w-full rounded-lg object-contain sm:max-h-[28rem]"
            />
          </a>
        </div>
      ) : null}

      {isPdf ? (
        <div className="border-t border-[var(--border)] bg-[var(--brand-bone)] p-4 dark:bg-[var(--surface-subtle)]">
          <iframe
            src={previewUrl}
            title={`Preview of ${file.name}`}
            className="h-64 w-full rounded-lg border border-[var(--border)] bg-white sm:h-[28rem] dark:bg-[var(--surface)]"
          />
          <p className="mt-3 text-[12px] leading-[15px] text-[var(--muted)]">
            Inline preview unavailable?{" "}
            <Link
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--brand-indigo)] underline underline-offset-4 dark:text-[var(--brand-cerulean)]"
            >
              Open PDF in a new tab
            </Link>
          </p>
        </div>
      ) : null}
    </figure>
  );
}
