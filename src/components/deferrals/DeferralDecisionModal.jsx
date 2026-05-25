import React from "react";
import { Modal, Button, Input } from "antd";

/** Matches approver queue decision modals — shared by creator & checker deferral flows. */
export const deferralDecisionModalWrapClassName =
  "deferral-decision-modal [&_.ant-modal]:max-sm:mx-auto [&_.ant-modal]:max-sm:my-3 [&_.ant-modal]:max-sm:max-w-[calc(100vw-24px)] [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:border-0 [&_.ant-modal-content]:bg-white [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:shadow-[0_16px_48px_rgba(18,36,36,0.12)] [&_.ant-modal-header]:m-0 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-[rgba(214,189,152,0.12)] [&_.ant-modal-header]:bg-white! [&_.ant-modal-title]:text-(--color-text-dark) [&_.ant-modal-close]:top-4 [&_.ant-modal-close]:end-5 [&_.ant-modal-close]:h-7 [&_.ant-modal-close]:w-7 [&_.ant-modal-close]:text-(--color-text-medium) hover:[&_.ant-modal-close]:bg-[rgba(214,189,152,0.08)] hover:[&_.ant-modal-close]:text-(--color-text-dark) [&_.ant-modal-body]:bg-white [&_.ant-modal-footer]:m-0 [&_.ant-modal-footer]:bg-white [&_.ant-modal-footer]:pt-0";

const decisionSecondaryButtonClassName =
  "min-w-[88px]! h-9! rounded-lg! border-[#d0d5dd]! bg-white! text-(--color-text-medium)! shadow-none! text-sm! font-medium! hover:border-[#d0d5dd]! hover:bg-[#f8fafc]! hover:text-(--color-text-dark)! focus:border-[#d0d5dd]! focus:bg-[#f8fafc]! focus:text-(--color-text-dark)! active:border-[#d0d5dd]! active:bg-[#f8fafc]! active:text-(--color-text-dark)! max-sm:w-full";

const decisionPrimaryButtonClassName =
  "min-w-[132px]! h-9! rounded-lg! border-0! bg-(--ncb-primary-500)! text-white! shadow-[0_2px_8px_rgba(58,179,229,0.16)]! text-sm! font-medium! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! [&>span]:text-white! max-sm:w-full";

const outerBodyClassName =
  "rounded-lg border border-[rgba(214,189,152,0.12)] bg-white p-4 shadow-sm [&_.ant-input]:min-h-[100px] [&_.ant-input]:rounded-md [&_.ant-input]:border-[#eaecf0] [&_.ant-input]:bg-white [&_.ant-input]:p-2.5 [&_.ant-input]:text-sm [&_.ant-input]:text-(--color-text-dark) [&_.ant-input]:shadow-none [&_.ant-input]:placeholder:text-[#98a2b3] hover:[&_.ant-input]:border-(--ncb-primary-500) focus-within:[&_.ant-input]:border-(--ncb-primary-500) focus-within:[&_.ant-input]:shadow-[0_0_0_2px_rgba(58,179,229,0.08)]";

const summaryCardClassName =
  "mb-4 rounded-lg border border-[rgba(214,189,152,0.12)] bg-[#fafafa] p-3";

const summaryTitleClassName =
  "text-xl font-semibold leading-tight text-(--color-text-dark)";

const summaryNameClassName =
  "mt-1 text-sm text-gray-500";

const summaryLineClassName =
  "mt-2 text-sm leading-relaxed text-gray-500";

const labelClassName =
  "block text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onCancel
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {import('react').ReactNode} [props.titleIcon]
 * @param {string} [props.deferralNumber]
 * @param {string} [props.customerName]
 * @param {string|string[]} props.summaryCopy — one string or multiple paragraphs
 * @param {string} props.inputLabel
 * @param {boolean} [props.inputRequired]
 * @param {string} props.inputValue
 * @param {(value: string) => void} props.onInputChange
 * @param {string} [props.inputPlaceholder]
 * @param {string} props.confirmText
 * @param {() => void} props.onConfirm
 * @param {boolean} [props.confirmLoading]
 * @param {boolean} [props.confirmDisabled]
 * @param {string} [props.confirmClassName] — appended to primary button (e.g. danger)
 * @param {number} [props.width]
 * @param {number} [props.zIndex]
 */
export default function DeferralDecisionModal({
  open,
  onCancel,
  title,
  subtitle,
  titleIcon = null,
  deferralNumber,
  customerName,
  summaryCopy,
  inputLabel,
  inputRequired = false,
  inputValue,
  onInputChange,
  inputPlaceholder = "",
  confirmText,
  onConfirm,
  confirmLoading = false,
  confirmDisabled = false,
  confirmClassName = "",
  width = 520,
  zIndex,
}) {
  const paragraphs = Array.isArray(summaryCopy)
    ? summaryCopy.filter(Boolean)
    : summaryCopy
      ? [summaryCopy]
      : [];

  return (
    <Modal
      title={(
        <div className="flex items-center gap-3 pr-8">
          {titleIcon ? (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[rgba(214,189,152,0.15)] bg-[rgba(26,54,54,0.03)] text-(--color-text-dark) [&_.anticon]:text-base">
              {titleIcon}
            </span>
          ) : null}
          <div className="flex flex-col gap-0.5">
            <strong className="text-base font-semibold leading-snug text-(--color-text-dark)">
              {title}
            </strong>
            <span className="text-xs leading-relaxed text-gray-400">{subtitle}</span>
          </div>
        </div>
      )}
      open={open}
      onCancel={onCancel}
      maskClosable={false}
      wrapClassName={deferralDecisionModalWrapClassName}
      zIndex={zIndex}
      styles={{
        header: { background: "white", margin: 0, padding: "16px 20px 12px" },
        body: { background: "white", padding: "0 20px 16px", margin: 0, maxHeight: "60vh", overflowY: "auto" },
        footer: { background: "white", padding: "0 20px 20px", margin: 0 },
        content: { background: "white", padding: 0, zoom: 0.8 },
      }}
      width={width}
      footer={[
        <div key="actions" className="flex justify-end gap-2">
          <Button
            className={decisionSecondaryButtonClassName}
            onClick={onCancel}
            disabled={confirmLoading}
          >
            Cancel
          </Button>
          <Button
            className={`${decisionPrimaryButtonClassName} ${confirmClassName || ""}`.trim()}
            loading={confirmLoading}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </Button>
        </div>,
      ]}
    >
      <div className={outerBodyClassName}>
        {/* Summary Card - Minimal */}
        <div className={summaryCardClassName}>
          <div className={summaryTitleClassName}>
            {deferralNumber || "Deferral request"}
          </div>
          <div className={summaryNameClassName}>
            {customerName || "Customer"}
          </div>
          {paragraphs.map((line, index) => (
            <div
              key={index}
              className={
                index === 0
                  ? summaryLineClassName
                  : "mt-1 text-sm leading-relaxed text-gray-500"
              }
            >
              {line}
            </div>
          ))}
        </div>

        {/* Input Section - Tightened */}
        <div className="flex flex-col gap-1">
          <label className={labelClassName}>
            {inputLabel}
            {inputRequired ? " *" : ""}
          </label>
          <Input.TextArea
            rows={3}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={inputPlaceholder}
            className="resize-y"
          />
        </div>
      </div>
    </Modal>
  );
}