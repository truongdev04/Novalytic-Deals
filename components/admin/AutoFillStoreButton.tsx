"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "nextjs-toploader/app";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import type { AutoFillImportResult } from "@/lib/data/autoFillImport";

type Step = "pick" | "previewing" | "preview" | "importing" | "done";

export function AutoFillStoreButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AutoFillImportResult | null>(null);

  function reset() {
    setStep("pick");
    setFile(null);
    setResult(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  function handlePickFile(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (picked) setFile(picked);
  }

  async function submitFile(endpoint: string): Promise<AutoFillImportResult> {
    const formData = new FormData();
    formData.append("file", file!);
    const res = await fetch(endpoint, { method: "POST", body: formData });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.data) {
      throw new Error(body?.error ?? "Có lỗi xảy ra.");
    }
    return body.data as AutoFillImportResult;
  }

  async function handleUploadAndPreview() {
    if (!file) return;
    setStep("previewing");
    try {
      setResult(await submitFile("/api/admin/auto-fill-store/parse"));
      setStep("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không đọc được file.");
      setStep("pick");
    }
  }

  async function handleConfirmImport() {
    if (!file) return;
    setStep("importing");
    try {
      setResult(await submitFile("/api/admin/auto-fill-store/import"));
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import thất bại.");
      setStep("preview");
    }
  }

  function handleDone() {
    setOpen(false);
    reset();
    router.refresh();
  }

  const canConfirm =
    result !== null && result.stores.created.length + result.stores.reused.length > 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handlePickFile}
      />
      <button
        type="button"
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Auto Fill Store
      </button>

      <Modal open={open} onOpenChange={handleOpenChange} title="Auto Fill Store" className="max-w-lg">
        {(step === "pick" || step === "previewing") && (
          <div>
            <p className="text-sm text-muted-600">
              Upload file Excel (.xlsx) xuất ra từ Tool Auto Fill (gồm sheet Stores + Coupons) để tự
              động tạo store và coupon.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-muted-300 bg-surface-100 px-4 py-6 text-sm font-medium text-brand-950 hover:bg-surface-200"
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : "Chọn file .xlsx"}
            </button>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadAndPreview}
                disabled={!file || step === "previewing"}
              >
                {step === "previewing" ? "Đang đọc file..." : "Upload & Preview"}
              </Button>
            </div>
          </div>
        )}

        {result && (step === "preview" || step === "importing" || step === "done") && (
          <div>
            <AutoFillResultSummary result={result} final={step === "done"} />

            <div className="mt-5 flex justify-end gap-2">
              {step === "preview" && (
                <>
                  <Button variant="outline" onClick={() => setStep("pick")}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleConfirmImport} disabled={!canConfirm}>
                    Confirm Import
                  </Button>
                </>
              )}
              {step === "importing" && (
                <Button variant="primary" disabled>
                  Đang import...
                </Button>
              )}
              {step === "done" && (
                <Button variant="primary" onClick={handleDone}>
                  Done
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function AutoFillResultSummary({ result, final }: { result: AutoFillImportResult; final: boolean }) {
  const { stores, coupons, reviewNotes } = result;

  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm">
      <div>
        <p className="font-medium text-brand-950">
          {stores.created.length} store {final ? "đã tạo" : "sẽ tạo"}, {stores.reused.length} store{" "}
          {final ? "đã dùng lại" : "sẽ dùng lại"}
        </p>
        {stores.created.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-muted-600">
            {stores.created.map((s) => (
              <li key={`created-${s.row}`}>{s.name}</li>
            ))}
          </ul>
        )}
        {stores.reused.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-muted-500">
            {stores.reused.map((s) => (
              <li key={`reused-${s.row}`}>{s.name} (đã có sẵn)</li>
            ))}
          </ul>
        )}
        {stores.errors.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-red-600">
            {stores.errors.map((e) => (
              <li key={`store-err-${e.row}`}>
                Dòng {e.row} ({e.name || "?"}): {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="font-medium text-brand-950">
          {coupons.created.length} coupon {final ? "đã tạo" : "sẽ tạo"}
        </p>
        {coupons.errors.length > 0 && (
          <ul className="mt-1 list-inside list-disc text-red-600">
            {coupons.errors.map((e) => (
              <li key={`coupon-err-${e.row}`}>
                Dòng {e.row} ({e.title || "?"} - {e.storeName}): {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {reviewNotes.length > 0 && (
        <div>
          <p className="font-medium text-brand-950">Ghi chú từ Tool Auto Fill</p>
          <ul className="mt-1 list-inside list-disc text-muted-500">
            {reviewNotes.map((note, i) => (
              <li key={`review-${i}`}>
                {note.store ? `${note.store}: ` : ""}
                {note.issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
