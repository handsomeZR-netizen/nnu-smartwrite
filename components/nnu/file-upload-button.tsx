"use client";

import * as React from "react";
import { UploadSimple, Camera, FileDoc, Warning, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.docx,image/*";

export interface FileUploadButtonProps {
  onExtracted: (text: string) => void;
  className?: string;
}

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number }
  | { phase: "parsing" }
  | { phase: "done"; chars: number }
  | { phase: "error"; message: string };

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onExtracted,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [state, setState] = React.useState<UploadState>({ phase: "idle" });

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    setState({ phase: "uploading", progress: 0 });
    try {
      const fd = new FormData();
      fd.append("file", file);
      setState({ phase: "parsing" });
      const resp = await fetch("/api/ocr", { method: "POST", body: fd });
      const data = await resp.json();
      if (!resp.ok) {
        const message =
          data?.message ||
          (resp.status === 500
            ? "服务端未配置 MinerU token"
            : `上传失败 (${resp.status})`);
        setState({ phase: "error", message });
        return;
      }
      if (data.status === "running") {
        setState({
          phase: "error",
          message: "MinerU 解析超时，请稍后用更小的文件重试",
        });
        return;
      }
      const text = (data.text as string | undefined)?.trim() || "";
      if (!text) {
        setState({
          phase: "error",
          message: "未识别到任何文字，请检查图片清晰度或换个文件",
        });
        return;
      }
      onExtracted(text);
      setState({ phase: "done", chars: text.length });
      // Auto-clear "done" badge after a few seconds
      setTimeout(() => setState({ phase: "idle" }), 4000);
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "网络错误",
      });
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    // reset so the same file can be re-picked
    e.target.value = "";
  };

  const isBusy = state.phase === "uploading" || state.phase === "parsing";
  const statusLabel = (() => {
    switch (state.phase) {
      case "uploading":
        return "上传中…";
      case "parsing":
        return "MinerU 识别中…";
      case "done":
        return `识别完成（${state.chars} 字）`;
      case "error":
        return state.message;
      default:
        return null;
    }
  })();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={onChange}
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          disabled={isBusy}
          className="gap-2 border-nnu-green/30 text-nnu-green hover:bg-nnu-green/5"
        >
          <Camera className="w-4 h-4" weight="regular" />
          拍照 / 图片
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          disabled={isBusy}
          className="gap-2 border-nnu-green/30 text-nnu-green hover:bg-nnu-green/5"
        >
          <FileDoc className="w-4 h-4" weight="regular" />
          Word / PDF
        </Button>
      </div>

      {statusLabel && (
        <div
          role={state.phase === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center gap-2 text-xs px-3 py-2 rounded-md",
            state.phase === "error" &&
              "bg-red-50 border border-red-200 text-red-700",
            state.phase === "done" &&
              "bg-green-50 border border-green-200 text-green-700",
            isBusy && "bg-nnu-paper border border-nnu-green/20 text-nnu-green",
          )}
        >
          {state.phase === "error" ? (
            <Warning className="w-4 h-4 flex-shrink-0" weight="regular" />
          ) : state.phase === "done" ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" weight="fill" />
          ) : (
            <UploadSimple className="w-4 h-4 flex-shrink-0 animate-pulse" weight="regular" />
          )}
          <span>{statusLabel}</span>
        </div>
      )}
    </div>
  );
};
