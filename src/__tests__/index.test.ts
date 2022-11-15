import { AirtableClone } from "../index";
import { generateRandomId } from "../helpers";
import { AirtableRecord, AirtableTable } from "../types";

const [table1Id, table2Id] = [generateRandomId(), generateRandomId()];

const table1LinkedFieldId = generateRandomId();
const table2LinkedFieldId = generateRandomId();

describe("Test AirtableClone", () => {
  // TODO: Add tests that ensure that the AirtableClone class works as expected in all cases.
  let airtableClone: AirtableClone;

  beforeAll(() => {
    airtableClone = new AirtableClone([
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
  });

  afterAll((done) => {
    done();
  });

  it("Should be an AirtableClone instance", () => {
    expect(airtableClone).toBeInstanceOf(AirtableClone);
  });

  it("Should create a text record in the first table", () => {
    const recordId = airtableClone.createRecord({
      tableId: table1Id,
      recordFieldsData: {
        [generateRandomId()]: "New York",
      },
    });

    expect(recordId).toBeDefined();
  });

  it("Should have one record in the first table", () => {
    const tables = airtableClone.getTables();
    const table1 = tables.find((table) => table.id === table1Id);

    expect(table1?.records.length).toBe(1);
  });

  it("Should get a record from the first table", () => {
    const tables = airtableClone.getTables();
    const table1 = tables.find(
      (table) => table.id === table1Id
    ) as AirtableTable;
    const recordId = table1.records[0]?.id;

    const record: AirtableRecord = airtableClone.getRecord({
      tableId: table1Id,
      recordId: recordId,
    });

    expect(record).toBeDefined();
  });

  it("Should create a link record in the second table", () => {
    const tables = airtableClone.getTables();
    const table1 = tables.find(
      (table) => table.id === table1Id
    ) as AirtableTable;
    const firstRecord = table1.records[0] as AirtableRecord;
    const record1Id = firstRecord.id;

    const record2Id = airtableClone.createRecord({
      tableId: table1Id,
      recordFieldsData: {
        [generateRandomId()]: "California",
      },
    }).id;

    const secondRecordId = airtableClone.createRecord({
      tableId: table2Id,
      recordFieldsData: {
        [generateRandomId()]: "USA",
        [table1LinkedFieldId]: [record1Id, record2Id],
      },
    }).id;

    table1.records.forEach((record) => {
      airtableClone.updateRecord({
        tableId: table1Id,
        recordId: record.id,
        recordFieldsData: {
          ...record.fields,
          [table1LinkedFieldId]: [secondRecordId],
        },
      });
    });

    expect(secondRecordId).toBeDefined();
  });

  it("Should have the linked data in the first table", () => {
    const tables = airtableClone.getTables();
    const table1 = tables.find(
      (table) => table.id === table1Id
    ) as AirtableTable;
    const firstRecord = table1.records[0] as AirtableRecord;
    const record1Id = firstRecord.id;

    const record = airtableClone.getRecord({
      tableId: table1Id,
      recordId: record1Id,
    }) as AirtableRecord;

    expect(record?.fields[table1LinkedFieldId]).toBeDefined();
  });

  it("Should update the text field in a record in the first table", () => {
    const tables = airtableClone.getTables();
    const table1 = tables.find(
      (table) => table.id === table1Id
    ) as AirtableTable;

    const recordToUpdate = table1.records.find((record) => {
      const textFieldId = Object.keys(record.fields).find((field) => {
        return typeof record.fields[field] === "string";
      }) as string;
      return record.fields[textFieldId];
    }) as AirtableRecord;
    const record1Id = recordToUpdate.id;

    const [textFieldId, linkFieldId] = Object.keys(recordToUpdate.fields);

    const record = airtableClone.updateRecord({
      tableId: table1Id,
      recordId: record1Id,
      recordFieldsData: {
        [textFieldId]: "Houston",
        [linkFieldId]: recordToUpdate.fields[linkFieldId],
      },
    });

    expect(record).toBeDefined();
  });

  it("Should add an entry to the second table, then update the first table text and link fields, and then second table link fields", () => {
    const tables = airtableClone.getTables();
    const table1 = tables.find(
      (table) => table.id === table1Id
    ) as AirtableTable;

    const record2Id = airtableClone.createRecord({
      tableId: table2Id,
      recordFieldsData: {
        [generateRandomId()]: "Azerbaijan",
        [table1LinkedFieldId]: [],
      },
    }).id;

    const recordToUpdate = table1.records.find((record) => {
      const textFieldId = Object.keys(record.fields).find((field) => {
        return typeof record.fields[field] === "string";
      }) as string;
      return record.fields[textFieldId];
    }) as AirtableRecord;

    const recordIdToRemove = recordToUpdate.id;
    const [textFieldId, linkFieldId] = Object.keys(recordToUpdate.fields);

    const newFieldsData = {
      [textFieldId]: "Baku",
      [linkFieldId]: [record2Id],
    };

    if (recordToUpdate.fields !== newFieldsData) {
      const linkedRecordIds = recordToUpdate.fields[
        table1LinkedFieldId
      ] as string[];
      const linkedRecordIdsToBeUpdated = linkedRecordIds.filter(
        (linkedRecordId) => linkedRecordId !== record2Id
      ) as string[];

      linkedRecordIdsToBeUpdated.forEach((linkedRecordId) => {
        const linkedRecordToUpdate = airtableClone.getRecord({
          tableId: table2Id,
          recordId: linkedRecordId,
        }) as AirtableRecord;

        const linkedRecordFieldId = Object.keys(
          linkedRecordToUpdate.fields
        ).find((field) =>
          Array.isArray(linkedRecordToUpdate.fields[field])
        ) as string;

        const linkedRecordFieldData = linkedRecordToUpdate.fields[
          linkedRecordFieldId
        ] as string[];

        const linkedRecordFieldToBeUpdated = linkedRecordFieldData.filter(
          (fieldId) => fieldId !== recordIdToRemove
        ) as string[];

        const updatedRecord2 = airtableClone.updateRecord({
          tableId: table2Id,
          recordId: linkedRecordId,
          recordFieldsData: {
            ...linkedRecordToUpdate.fields,
            [linkedRecordFieldId]: linkedRecordFieldToBeUpdated,
          },
        });

        expect(updatedRecord2).toBeDefined();
      });
    }

    const updatedRecord1 = airtableClone.updateRecord({
      tableId: table1Id,
      recordId: recordToUpdate.id,
      recordFieldsData: newFieldsData,
    });

    expect(updatedRecord1).toBeDefined();
  });

  it("Should delete a record from the second table", () => {
    const recordId = airtableClone.createRecord({
      tableId: table2Id,
      recordFieldsData: {
        [generateRandomId()]: "Indonesia",
        [table1LinkedFieldId]: [],
      },
    }).id;

    const isDeleted = airtableClone.deleteRecord({
      tableId: table2Id,
      recordId: recordId,
    });

    expect(isDeleted).toBe(true);
  });

  it("Should delete a table", () => {
    airtableClone.deleteTable({
      tableId: table1Id,
    });

    expect(airtableClone.getTables()).toHaveLength(1);
    expect(airtableClone).toBeInstanceOf(AirtableClone);
  });

  it("Should throw an error when deleting a table if the table does not exist", () => {
    expect(() => {
      airtableClone.deleteTable({
        tableId: table1Id,
      });
    }).toThrow("Table does not exist");

    expect(() => {
      airtableClone.deleteTable({
        tableId: table1Id,
      });
    }).toThrow(Error);
  });
});
