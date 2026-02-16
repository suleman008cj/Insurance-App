import { Table } from 'react-bootstrap';

export default function DataTable({ columns, data, keyField = 'id', emptyMessage = 'No data' }) {
  if (!data?.length) {
    return (
      <p className="text-muted text-center py-4 mb-0">{emptyMessage}</p>
    );
  }
  return (
    <Table responsive hover className="mb-0 align-middle">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row[keyField] || row._id}>
            {columns.map((col) => (
              <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
