import { Client, Connection } from "@temporalio/client";

let _client: Client | null = null;

export async function getClient(): Promise<Client> {
  if (!_client) {
    const connection = await Connection.connect();
    _client = new Client({ connection });
  }
  return _client;
}
