import express, { Express, Request, Response } from "express";
import expressLayouts from "express-ejs-layouts";
import bodyParser from "body-parser";

import { AirtableRecord, AirtableTable } from "./types";
import { generateRandomId } from "./helpers";

const app: Express = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/styles", express.static(__dirname + "public/styles"));
app.use(expressLayouts);
app.set("layout", "./layouts/main");
app.set("view engine", "ejs");

const PORT = 3000;

const [table1Id, table2Id] = [generateRandomId(), generateRandomId()];

const table1LinkedFieldId = generateRandomId();
const table2LinkedFieldId = generateRandomId();

export class AirtableClone {
  private tables: AirtableTable[];

  constructor(tables: AirtableTable[]) {
    this.tables = tables;
  }

  getTables(): AirtableTable[] {
    return this.tables;
  }

  createRecord(args: {
    tableId: string;
    recordFieldsData: AirtableRecord["fields"];
  }): AirtableRecord {
    const { tableId, recordFieldsData } = args;

    // Check if table exists
    const tableToCreateRecord = this.tables.find(
      (table) => table.id === tableId
    );
    // If not, throw an error
    if (!tableToCreateRecord) {
      throw new Error("Table does not exist");
    }
    // Create a new record
    let nextRecordId: string = generateRandomId();

    // In case we have a record with the same ID
    while (
      tableToCreateRecord?.records.find((record) => record.id === nextRecordId)
    ) {
      nextRecordId = generateRandomId();
    }

    const newRecord: AirtableRecord = {
      id: nextRecordId,
      fields: recordFieldsData,
    };

    // Create the record
    tableToCreateRecord?.records.push(newRecord);

    // Return the record
    return newRecord;
  }

  updateRecord(args: {
    tableId: string;
    recordId: string;
    recordFieldsData: AirtableRecord["fields"];
  }): AirtableRecord {
    const { tableId, recordId, recordFieldsData } = args;

    // Check if table exists
    const tableToUpdate = this.tables.find((table) => table.id === tableId);
    // If not, throw an error
    if (!tableToUpdate) {
      throw new Error("Table does not exist");
    }

    // Find the record to update
    const recordToUpdate = tableToUpdate.records.find(
      (record) => record.id === recordId
    );
    // If not, throw an error
    if (!recordToUpdate) {
      throw new Error("Record does not exist");
    }

    // Update the record
    recordToUpdate.fields = recordFieldsData;

    // Return the record
    return recordToUpdate;
  }

  getRecord(args: { tableId: string; recordId: string }): AirtableRecord {
    // Check if table exists
    const desiredTable = this.tables.find((table) => table.id === args.tableId);

    // If not, throw an error
    if (!desiredTable) {
      throw new Error("Table does not exist");
    }

    // Check if record exists
    const desiredRecord = desiredTable.records.find(
      (record) => record.id === args.recordId
    );

    // If not, throw an error
    if (!desiredRecord) {
      throw new Error("Record does not exist");
    }

    // Return the record
    return desiredRecord;
  }

  deleteRecord(args: { tableId: string; recordId: string }): boolean {
    const { tableId, recordId } = args;
    // Check if table exists
    const tableToDeleteFrom = this.tables.find((table) => table.id === tableId);

    // If not, throw an error
    if (!tableToDeleteFrom) {
      throw new Error("Table does not exist");
    }

    // Check if record exists
    const ourRecord = tableToDeleteFrom.records.find(
      (record) => record.id === recordId
    );

    // If not, throw an error
    if (!ourRecord) {
      throw new Error("Record does not exist");
    }

    // Delete the record
    tableToDeleteFrom.records = tableToDeleteFrom.records.filter(
      (record) => record.id !== recordId
    );

    return true;
  }

  deleteTable(args: { tableId: string }): boolean {
    const { tableId } = args;

    // Check if table exists
    const tableToDelete = this.tables.find((table) => table.id === tableId);

    // If not, throw an error
    if (!tableToDelete) {
      throw new Error("Table does not exist");
    }

    // Delete the table
    this.tables = this.tables.filter((table) => table.id !== tableId);

    // Return true
    return true;
  }
}

const airtableClone: AirtableClone = new AirtableClone([
  {
    id: table1Id,
    records: [],
    fields: [
      { id: generateRandomId(), type: "text" },
      {
        id: table1LinkedFieldId,
        type: "link",
        linkedTableId: table2Id,
        fieldIdInLinkedTable: table2LinkedFieldId,
      },
    ],
  },
  {
    id: table2Id,
    records: [],
    fields: [
      { id: generateRandomId(), type: "text" },
      {
        id: table2LinkedFieldId,
        type: "link",
        linkedTableId: table1Id,
        fieldIdInLinkedTable: table1LinkedFieldId,
      },
    ],
  },
]);

app.get("/", (req: Request, res: Response) => {
  const tables = airtableClone.getTables();

  let selectedTableId = req.query.tableId as string;
  if (!selectedTableId) {
    selectedTableId = tables[0].id;
    return res.redirect(`/?tableId=${selectedTableId}`);
  }

  const selectedTableExists = tables.find(
    (table) => table.id === selectedTableId
  );
  if (!selectedTableExists) {
    selectedTableId = tables[0].id;
    return res.redirect(`/?tableId=${selectedTableId}`);
  }

  return res.render("index", {
    title: "AirTable Clone",
    tables: airtableClone.getTables(),
    selectedTableId,
  });
});

app.post("/create-record", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");

  const { tableId, text } = req.body;

  const tables = airtableClone.getTables();

  const selectedTableExists = tables.find((table) => table.id === tableId);
  if (!selectedTableExists) {
    res.status(400).send({
      error: "Table does not exist",
    });
  } else {
    const record = airtableClone.createRecord({
      tableId,
      recordFieldsData: {
        [table1LinkedFieldId]: text,
      },
    });

    res.json(record);
  }
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
