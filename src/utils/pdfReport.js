import jsPDF from "jspdf";
import "jspdf-autotable";

export function generateMonthlyReport(transactions, user) {
  const doc = new jsPDF();
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  // Filter this month's transactions
  const monthTxns = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income  = monthTxns.filter(t => t.type === "income").reduce((s, t)  => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expense;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Personal Finance Report", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(monthName, 14, 28);
  doc.text(`Generated for: ${user?.name || "User"}`, 14, 35);

  // Summary boxes
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  const boxes = [
    { label: "Total Income",  value: `₹${income.toLocaleString()}`,  x: 14,  color: [16, 185, 129] },
    { label: "Total Expense", value: `₹${expense.toLocaleString()}`, x: 80,  color: [239, 68, 68] },
    { label: "Net Savings",   value: `₹${savings.toLocaleString()}`, x: 146, color: savings >= 0 ? [59, 130, 246] : [239, 68, 68] },
  ];

  boxes.forEach(b => {
    doc.setFillColor(...b.color);
    doc.roundedRect(b.x, 48, 58, 22, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(b.label, b.x + 4, 56);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(b.value, b.x + 4, 65);
  });

  // Category breakdown
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Expense by Category", 14, 84);

  const catMap = {};
  monthTxns.filter(t => t.type === "expense").forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const catRows = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [cat, `₹${amt.toLocaleString()}`, `${((amt / expense) * 100).toFixed(1)}%`]);

  doc.autoTable({
    startY: 88,
    head: [["Category", "Amount", "% of Total"]],
    body: catRows,
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // Transaction list
  const tableEnd = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("All Transactions", 14, tableEnd);

  const txnRows = monthTxns
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(t => [
      t.date,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.category,
      t.description || "-",
      `₹${t.amount.toLocaleString()}`,
    ]);

  doc.autoTable({
    startY: tableEnd + 4,
    head: [["Date", "Type", "Category", "Description", "Amount"]],
    body: txnRows,
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8 },
    columnStyles: { 4: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Cloud-Based Personal Finance Tracker  •  Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  doc.save(`Finance_Report_${monthName.replace(" ", "_")}.pdf`);
}
