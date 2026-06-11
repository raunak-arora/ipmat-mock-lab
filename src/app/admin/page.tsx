import QuestionAdmin from "@/components/QuestionAdmin";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="text-sm text-muted">
          Add questions, bulk-import JSON, or browse and prune the bank. New
          questions immediately feed into generated mocks.
        </p>
      </div>
      <QuestionAdmin />
    </div>
  );
}
