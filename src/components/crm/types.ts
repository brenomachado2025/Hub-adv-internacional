export type CrmClient = {
  id: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  legalArea: string;
  companyName: string;
  city: string;
  phone: string;
  email: string;
  status: string;
  assigneeId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
};
