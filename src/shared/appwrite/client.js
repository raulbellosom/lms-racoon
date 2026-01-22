import { Client, Account, Databases, Storage, Functions, Query, ID } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

export const client = new Client();

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[Appwrite] Missing VITE_APPWRITE_ENDPOINT / VITE_APPWRITE_PROJECT_ID. App will run in demo mode."
  );
}

export const account = new Account(client);
export const db = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { Query, ID };
