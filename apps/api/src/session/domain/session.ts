export class Session {
  id: number | string;
  userId: number;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
