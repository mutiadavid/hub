import React from "react";
import { Modal, Button, Input } from "antd";

/** Matches approver queue decision modals — shared by creator & checker deferral flows. */
export const deferralDecisionModalWrapClassName =
  "deferral-decision-modal [&_.ant-modal]:max-sm:mx-auto [&_.ant-modal]:max-sm:my-3 [&_.ant-modal]:max-sm:max-w-[calc(100vw-24px)] [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:border-0 [&_.ant-modal-content]:bg-white [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:shadow-[0_32px_72px_rgba(18,36,36,0.24)] [&_.ant-modal-header]:m-0 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-[rgba(214,189,152,0.18)] [&_.ant-modal-header]:bg-white! [&_.ant-modal-title]:text-(--color-text-dark) [&_.ant-modal-close]:top-5 [&_.ant-modal-close]:end-5 [&_.ant-modal-close]:h-8 [&_.ant-modal-close]:w-8 [&_.ant-modal-close]:text-(--color-text-medium) hover:[&_.ant-modal-close]:bg-[rgba(214,189,152,0.12)] hover:[&_.ant-modal-close]:text-(--color-text-dark) [&_.ant-modal-body]:bg-white [&_.ant-modal-footer]:m-0 [&_.ant-modal-footer]:bg-white [&_.ant-modal-footer]:pt-0";

const decisionSecondaryButtonClassName =
  "min-w-[92px]! h-11! rounded-[10px]! border-[#d0d5dd]! bg-white! text-(--color-text-medium)! shadow-none! font-semibold! hover:border-[#d0d5dd]! hover:bg-[#f8fafc]! hover:text-(--color-text-dark)! focus:border-[#d0d5dd]! focus:bg-[#f8fafc]! focus:text-(--color-text-dark)! active:border-[#d0d5dd]! active:bg-[#f8fafc]! active:text-(--color-text-dark)! max-sm:w-full";

const decisionPrimaryButtonClassName =
  "min-w-[156px]! h-11! rounded-[10px]! border-0! bg-(--ncb-primary-500)! text-white! shadow-[0_10px_20px_rgba(58,179,229,0.18)]! font-bold! hover:bg-(--ncb-primary-700)! hover:text-white! focus:bg-(--ncb-primary-700)! focus:text-white! active:bg-(--ncb-primary-700)! active:text-white! [&>span]:text-white! max-sm:w-full";

const outerBodyClassName =
  "rounded-[14px] border border-[rgba(214,189,152,0.18)] bg-[rgba(255,255,255,0.98)] p-5 shadow-[0_10px_28px_rgba(26,54,54,0.06)] max-sm:p-3.5 [&_.ant-input]:min-h-[132px] [&_.ant-input]:rounded-[10px] [&_.ant-input]:border-[#eaecf0] [&_.ant-input]:bg-white [&_.ant-input]:p-3.5 [&_.ant-input]:text-[15px] [&_.ant-input]:text-(--color-text-dark) [&_.ant-input]:shadow-none [&_.ant-input]:placeholder:text-[#98a2b3] hover:[&_.ant-input]:border-(--ncb-primary-500) focus-within:[&_.ant-input]:border-(--ncb-primary-500) focus-within:[&_.ant-input]:shadow-[0_0_0_2px_rgba(58,179,229,0.12)]";

const summaryCardClassName =
  "mb-5 rounded-[14px] border border-[rgba(214,189,152,0.18)] bg-white p-[18px] max-sm:mb-3 max-sm:rounded-[10px] max-sm:p-3";

const summaryTitleClassName =
  "text-[28px] font-bold leading-[1.2] text-(--color-text-dark) max-sm:text-[22px]";

const summaryNameClassName =
  "mt-2 text-[18px] leading-[1.35] text-(--color-text-medium) max-sm:text-base";

const summaryLineClassName =
  "mt-4 text-[15px] leading-[1.65] text-(--color-text-medium) max-sm:text-sm";

const labelClassName =
  "block text-[11px] font-bold uppercase tracking-[0.16em] text-(--color-text-medium)";

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
  width = 760,
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
        <div className="flex items-start gap-4 pr-9 max-sm:gap-3 max-sm:pr-6">
          {titleIcon ? (
            <span className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[rgba(214,189,152,0.2)] bg-[rgba(26,54,54,0.04)] text-(--color-text-dark) [&_.anticon]:text-[22px] max-sm:h-11 max-sm:w-11">
              {titleIcon}
            </span>
          ) : null}
          <span className="flex flex-col gap-1.5">
            <strong className="text-[20px] font-bold leading-[1.2] text-(--color-text-dark) max-sm:text-[18px]">
              {title}
            </strong>
            <span className="text-[13px] leading-[1.45] text-(--color-text-medium)">{subtitle}</span>
          </span>
        </div>
      )}
      open={open}
      onCancel={onCancel}
      maskClosable={false}
      wrapClassName={deferralDecisionModalWrapClassName}
      zIndex={zIndex}
      styles={{
        header: { background: "white", margin: 0, padding: "22px 26px 18px" },
        body: { background: "white", padding: "28px 26px 24px" },
        footer: { background: "white", padding: "0 26px 24px", margin: 0 },
        content: { background: "white", padding: 0 },
      }}
      width={width}
      footer={[
        <div key="actions" className="flex justify-end gap-3 max-sm:flex-col-reverse">
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
                  : "mt-2 text-[15px] leading-[1.65] text-(--color-text-medium) max-sm:text-sm"
              }
            >
              {line}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClassName}>
            {inputLabel}
            {inputRequired ? " (Required)" : ""}
          </label>
          <Input.TextArea
            rows={4}
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