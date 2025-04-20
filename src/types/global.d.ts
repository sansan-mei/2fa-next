/* eslint-disable @typescript-eslint/no-explicit-any */
declare type AuthItem = {
  id: string;
  name: string;
  issuer: string | undefined;
  code: string;
  order?: number;
};

declare type AnyObject = Record<string, any>;

declare type AnyArray = Array<any>;

declare type IDBValue = {
  secret: string;
  title: string;
  description?: string;
  order?: number;
};

declare interface ExportDataItem {
  id: string;
  secret: string;
  title: string;
  description?: string;
  order?: number;
}
