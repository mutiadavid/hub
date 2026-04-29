import React from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Form,
  Typography,
  Row,
  Col,
  Divider,
} from "antd";
import { BankOutlined, SearchOutlined } from "@ant-design/icons";
import { LOAN_TYPE_OPTIONS, SEARCH_MODE } from "../utils/constants";
import "../../../../styles/creatorDesignSystem.css";

const { Title } = Typography;
const { Option } = Select;

export default function CustomerSearch({
  searchMode,
  setSearchMode,
  searchCustomerNumber,
  setSearchCustomerNumber,
  searchLoanType,
  setSearchLoanType,
  searchDclNumber,
  setSearchDclNumber,
  customerSearchResults,
  dclSearchResults,
  showSearchForm,
  setShowSearchForm,
  onFetchCustomer,
  onSelectCustomer,
  onSelectDcl,
  isFetching,
  onBack,
}) {
  return (
    <div className="creator-theme p-6 min-h-full bg-(--color-bg)">
      <div className="max-w-[760px] mx-auto my-3 md:my-8">
        <Card
          className="bg-white border border-[rgba(214,189,152,0.2)] rounded-xl shadow-[0_16px_34px_rgba(26,54,54,0.08)] overflow-hidden [&_.ant-card-body]:p-0"
          style={{ minHeight: showSearchForm ? "auto" : "450px" }}
        >
          <div className="pt-10 px-[18px] md:px-8 pb-7 flex flex-col items-center text-center gap-3.5 border-t-4 border-(--color-accent) bg-[radial-gradient(circle_at_top_center,rgba(214,189,152,0.18),transparent_32%),linear-gradient(180deg,rgba(245,247,244,0.72)_0%,rgba(255,255,255,0.96)_100%)]">
            <BankOutlined className="text-[62px] text-(--color-primary-dark)" />

            <Title level={3} className="m-0! text-(--color-text-dark)! text-[20px]! font-bold! tracking-[-0.03em]">
              Start New Deferral Request
            </Title>

            <Typography.Text className="block !text-(--color-text-light) text-[14px] max-w-[520px]">
              Please search for a customer to begin the deferral request process
            </Typography.Text>
          </div>

          <div className="px-[18px] md:px-7 pb-7">
            {showSearchForm ? (
              <>
                <Divider className="!m-0 !mb-7 !border-[rgba(214,189,152,0.2)]" />

                {/* Search Mode Tabs */}
                <div className="flex flex-col md:flex-row justify-stretch md:justify-center gap-3 flex-wrap mb-6">
                  <Button
                    className="w-full md:w-auto min-w-[240px] h-11 !bg-(--ncb-primary-500) !text-white !border-none [&>span]:!bg-transparent !rounded-lg !shadow-none !font-semibold !font-[inherit]"
                    onClick={() => {
                      setSearchMode(SEARCH_MODE.CUSTOMER);
                      setSearchDclNumber("");
                    }}
                  >
                    Search by Customer Number
                  </Button>
                  <Button
                    className="w-full md:w-auto min-w-[240px] h-11 !bg-(--ncb-primary-500) !text-white !border-none [&>span]:!bg-transparent !rounded-lg !shadow-none !font-semibold !font-[inherit]"
                    onClick={() => {
                      setSearchMode(SEARCH_MODE.DCL);
                      setSearchCustomerNumber("");
                      setSearchLoanType("");
                    }}
                  >
                    Search by DCL Number
                  </Button>
                </div>

                <div className="text-left flex flex-col gap-1 [&_.ant-form-item]:mb-[22px] [&_.ant-form-item-label>label]:!text-(--color-text-dark) [&_.ant-form-item-label>label]:!text-[13px] [&_.ant-form-item-label>label]:!font-bold [&_.ant-form-item-required::before]:!text-[#dc2626]">
                  {searchMode === SEARCH_MODE.CUSTOMER ? (
                    <Form layout="vertical" onFinish={onFetchCustomer}>
                      <Form.Item
                        label="Customer Number"
                        name="customerNumber"
                        rules={[
                          {
                            required: true,
                            message: "Please enter customer number",
                          },
                        ]}
                      >
                        <div className="relative">
                          <Input
                            className="deferral-search-input !min-h-[46px] !px-[14px] !py-[10px] !border-[rgba(214,189,152,0.2)] !rounded-lg !bg-white !shadow-none !text-[14px] !text-(--color-text-dark) focus:!border-(--color-primary-dark) hover:!border-(--color-primary-dark) focus:!shadow-[0_0_0_2px_rgba(26,54,54,0.08)] hover:!shadow-[0_0_0_2px_rgba(26,54,54,0.08)]"
                            type="text"
                            size="large"
                            value={searchCustomerNumber}
                            onChange={(e) =>
                              setSearchCustomerNumber(
                                e.target.value.replace(/\D/g, "")
                              )
                            }
                            placeholder="e.g. 123456"
                            autoFocus
                          />

                          {/* Typeahead suggestions */}
                          {customerSearchResults &&
                            customerSearchResults.length > 0 && (
                              <div className="absolute top-[50px] left-0 right-0 z-[1200] bg-white border border-[rgba(214,189,152,0.2)] shadow-[0_12px_24px_rgba(26,54,54,0.08)] max-h-[240px] overflow-y-auto rounded-lg">
                                {customerSearchResults.map((c) => (
                                  <div
                                    key={c._id}
                                    onClick={() => onSelectCustomer(c)}
                                    className="p-3 px-3.5 border-b border-[rgba(214,189,152,0.12)] cursor-pointer flex flex-col md:flex-row justify-start md:justify-between items-start md:items-center gap-3 transition-colors duration-150 hover:bg-[rgba(214,189,152,0.08)] last:border-b-0"
                                  >
                                    <div>
                                      <div className="font-semibold text-(--color-text-dark)">
                                        {c.name}
                                      </div>
                                      <div className="text-[12px] text-(--color-text-light)">
                                        {c.customerNumber}
                                      </div>
                                    </div>
                                    <div className="text-[12px] text-(--color-text-light)">
                                      {c.email}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </Form.Item>

                      <Form.Item
                        label="Loan Type"
                        name="loanType"
                        rules={[
                          { required: true, message: "Please select loan type" },
                        ]}
                      >
                        <Select
                          className="w-full [&_.ant-select-selector]:!min-h-[46px] [&_.ant-select-selector]:!px-[14px] [&_.ant-select-selector]:!py-[10px] [&_.ant-select-selector]:!border-[rgba(214,189,152,0.2)] [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!shadow-none [&_.ant-select-selector]:!text-[14px] [&_.ant-select-selector]:!text-(--color-text-dark) [&.ant-select-focused_.ant-select-selector]:!border-(--color-primary-dark) hover:[&_.ant-select-selector]:!border-(--color-primary-dark) [&.ant-select-focused_.ant-select-selector]:!shadow-[0_0_0_2px_rgba(26,54,54,0.08)] hover:[&_.ant-select-selector]:!shadow-[0_0_0_2px_rgba(26,54,54,0.08)]"
                          size="large"
                          value={searchLoanType}
                          onChange={setSearchLoanType}
                          placeholder="Select loan type"
                        >
                          {LOAN_TYPE_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <div className="flex flex-col md:flex-row justify-stretch md:justify-end gap-2.5 mt-1.5 flex-wrap">
                        <Button
                          className="deferral-search-secondary w-full md:w-auto h-11 !px-[18px]"
                          onClick={() => setShowSearchForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="deferral-search-primary w-full md:w-auto min-w-[220px] h-11 text-[15px] !px-[18px]"
                          htmlType="submit"
                          loading={isFetching}
                        >
                          {isFetching ? "Fetching..." : "Fetch Customer"}
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <Form layout="vertical">
                      <Form.Item
                        label="DCL Number"
                        rules={[
                          { required: true, message: "Please enter DCL number" },
                        ]}
                      >
                        <div className="relative">
                          <Input
                            className="deferral-search-input !min-h-[46px] !px-[14px] !py-[10px] !border-[rgba(214,189,152,0.2)] !rounded-lg !bg-white !shadow-none !text-[14px] !text-(--color-text-dark) focus:!border-(--color-primary-dark) hover:!border-(--color-primary-dark) focus:!shadow-[0_0_0_2px_rgba(26,54,54,0.08)] hover:!shadow-[0_0_0_2px_rgba(26,54,54,0.08)]"
                            type="text"
                            size="large"
                            value={searchDclNumber}
                            onChange={(e) => setSearchDclNumber(e.target.value)}
                            placeholder="e.g. DCL-26-0183"
                            autoFocus
                          />

                          {/* DCL Typeahead suggestions */}
                          {dclSearchResults && dclSearchResults.length > 0 && (
                            <div className="absolute top-[50px] left-0 right-0 z-[1200] bg-white border border-[rgba(214,189,152,0.2)] shadow-[0_12px_24px_rgba(26,54,54,0.08)] max-h-[240px] overflow-y-auto rounded-lg">
                              {dclSearchResults.map((dcl) => (
                                <div
                                  key={dcl.id}
                                  onClick={() => onSelectDcl(dcl)}
                                  className="p-3 px-3.5 border-b border-[rgba(214,189,152,0.12)] cursor-pointer flex flex-col items-start gap-3 transition-colors duration-150 hover:bg-[rgba(214,189,152,0.08)] last:border-b-0"
                                >
                                  <div className="font-semibold text-(--color-text-dark)">
                                    {dcl.dclNo}
                                  </div>
                                  <div className="text-[12px] text-(--color-text-light)">
                                    {dcl.customerName} ({dcl.customerNumber})
                                  </div>
                                  <div className="text-[12px] text-(--color-text-light)">
                                    Loan Type: {dcl.loanType}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Form.Item>

                      <Typography.Text
                        className="text-[12px] text-(--color-text-light) mt-2 block"
                      >
                        Tip: Start typing a DCL number to search. Customer details
                        will auto-populate when you select a DCL.
                      </Typography.Text>

                      <div className="flex flex-col md:flex-row justify-stretch md:justify-end gap-2.5 mt-1.5 flex-wrap">
                        <Button
                          className="deferral-search-secondary w-full md:w-auto h-11 !px-[18px]"
                          onClick={() => setShowSearchForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </Form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col md:flex-row justify-stretch md:justify-center gap-3 flex-wrap">
                <Button
                  className="deferral-search-trigger w-full md:w-auto min-w-[220px] h-11 text-[15px] !px-6"
                  icon={<SearchOutlined />}
                  onClick={() => setShowSearchForm(true)}
                  loading={isFetching}
                >
                  {isFetching ? "Searching..." : "Search Customer"}
                </Button>
              </div>
            )}

            <div className="flex justify-stretch md:justify-center mt-2">
              <Button
                className="deferral-search-back w-full md:w-auto h-11 !px-[18px]"
                onClick={onBack}
              >
                ← Back to My Deferrals
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}