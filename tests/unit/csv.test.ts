import { describe, it, expect } from "vitest";
import { toCSV, CSVColumn } from "@/lib/utils/csv";

interface Row {
  name: string;
  amount: number | null;
  note?: string | null;
}

const columns: CSVColumn<Row>[] = [
  { header: "Name", accessor: (r) => r.name },
  { header: "Amount", accessor: (r) => r.amount },
  { header: "Note", accessor: (r) => r.note },
];

describe("toCSV", () => {
  it("emits header row and data rows with correct columns", () => {
    const csv = toCSV<Row>(
      [
        { name: "Alice", amount: 500, note: "ok" },
        { name: "Bob", amount: 1500, note: "vip" },
      ],
      columns
    );
    expect(csv).toBe(
      "Name,Amount,Note\r\nAlice,500,ok\r\nBob,1500,vip"
    );
  });

  it("emits header-only output when rows are empty (UAT 3)", () => {
    const csv = toCSV<Row>([], columns);
    expect(csv).toBe("Name,Amount,Note");
    expect(csv.split("\r\n")).toHaveLength(1);
  });

  it("escapes commas, quotes, and newlines per RFC 4180", () => {
    const csv = toCSV<Row>(
      [
        { name: "Doe, John", amount: 100, note: 'He said "hi"' },
        { name: "Line\nBreak", amount: 200, note: "carriage\rreturn" },
      ],
      columns
    );
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("Name,Amount,Note");
    expect(lines[1]).toBe('"Doe, John",100,"He said ""hi"""');
    expect(lines[2]).toBe('"Line\nBreak",200,"carriage\rreturn"');
  });

  it("renders null and undefined cells as empty strings", () => {
    const csv = toCSV<Row>(
      [{ name: "Eve", amount: null, note: undefined }],
      columns
    );
    expect(csv).toBe("Name,Amount,Note\r\nEve,,");
  });
});
