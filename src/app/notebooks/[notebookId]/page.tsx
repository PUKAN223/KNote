import { ClientApp } from "../../../components/ClientApp";

export default async function NotebookPage({
  params,
}: {
  params: Promise<{ notebookId: string }>;
}) {
  const { notebookId } = await params;

  return <ClientApp initialNotebookId={notebookId} />;
}
