import { Document20 } from "@frosted-ui/icons";
import { Button } from "@whop/react/components";
import Link from "next/link";
import { formatFileSize } from "@/components/business/format";

type ProofFile = {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export function ProofFilePreview({ file }: { file: ProofFile }) {
  const downloadUrl = `/api/files/${file.id}`;
  const previewUrl = `${downloadUrl}?inline=1`;
  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";

  return (
    <div className="space-y-3">
      {isImage ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="block overflow-hidden rounded-xl bg-[var(--surface-subtle)] ring-1 ring-black/6 dark:ring-white/10"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={file.name}
            className="max-h-80 w-full object-contain"
          />
        </a>
      ) : null}
      {isPdf ? (
        <div className="overflow-hidden rounded-xl bg-[var(--surface-subtle)] ring-1 ring-black/6 dark:ring-white/10">
          <iframe
            src={previewUrl}
            title={file.name}
            className="h-80 w-full"
          />
        </div>
      ) : null}
      <Button asChild variant="surface" color="gray" size="2">
        <Link href={downloadUrl} target="_blank">
          <Document20 aria-hidden="true" />
          {file.name}
          <span className="text-current/55">{formatFileSize(file.sizeBytes)}</span>
        </Link>
      </Button>
    </div>
  );
}
