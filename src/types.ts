export type AirtableTextField = {
  type: "text";
  id: string;
};

export type AirtableLinkField = {
  type: "link";
  id: string;

  /**
   * The ID of the table that this field links to.
   */
  linkedTableId: string;

  /**
   * The ID of the bi directional field that this field links to in the linked table.
   */
  fieldIdInLinkedTable: string;
};

export type AirtableField = AirtableTextField | AirtableLinkField;

export type AirtableRecord = {
  id: string;
  fields: {
    // Text Field -> string
    // Link Field -> string[], where each string is the ID of a record
    [key: string]: string | string[];
  };
};

export type AirtableTable = {
  id: string;
  fields: AirtableField[];
  records: AirtableRecord[];
};
