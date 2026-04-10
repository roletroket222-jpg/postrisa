import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { APP_NAME } from "@/lib/constants";
import { formatCurrency, formatDateOnly, formatNumber } from "@/lib/format";
import { type getEmployeeSlipDataForAdmin } from "@/server/reports/performance";

type EmployeeSlipData = NonNullable<Awaited<ReturnType<typeof getEmployeeSlipDataForAdmin>>>;

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 28,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  hero: {
    border: "1 solid #cbd5e1",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
    marginBottom: 18,
  },
  badge: {
    fontSize: 9,
    color: "#0369a1",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#475569",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoCard: {
    width: "48%",
    border: "1 solid #e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#ffffff",
  },
  infoLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },
  summaryCard: {
    flexGrow: 1,
    border: "1 solid #e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#ffffff",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 4,
  },
  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderBottom: "1 solid #cbd5e1",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
  },
  tableRowLast: {
    borderBottom: "0",
  },
  cellDate: {
    width: "17%",
    padding: 8,
  },
  cellProduct: {
    width: "41%",
    padding: 8,
  },
  cellQty: {
    width: "12%",
    padding: 8,
    textAlign: "right",
  },
  cellUnit: {
    width: "15%",
    padding: 8,
    textAlign: "right",
  },
  cellTotal: {
    width: "15%",
    padding: 8,
    textAlign: "right",
  },
  headerText: {
    fontSize: 9,
    fontWeight: 700,
  },
  footer: {
    marginTop: 18,
    borderTop: "1 solid #cbd5e1",
    paddingTop: 10,
    color: "#64748b",
    fontSize: 8,
  },
});

function getSnapshotUnitUpah(qty: number, upah: number) {
  if (qty <= 0) {
    return 0;
  }

  return Math.round(upah / qty);
}

function SlipDocument({ data }: { data: EmployeeSlipData }) {
  return (
    <Document
      author={APP_NAME}
      creator={APP_NAME}
      subject="Slip gaji"
      title={`Slip Gaji ${data.employee.nama}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.badge}>Slip Gaji</Text>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>
            Periode {formatDateOnly(data.filters.fromDate)} sampai{" "}
            {formatDateOnly(data.filters.toDate)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Karyawan</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoValue}>{data.employee.nama}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Divisi</Text>
              <Text style={styles.infoValue}>{data.employee.divisi}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Kategori</Text>
              <Text style={styles.infoValue}>{data.employee.kategori}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Jumlah Record</Text>
              <Text style={styles.infoValue}>{formatNumber(data.summary.totalRecords)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan Upah</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.infoLabel}>Total Qty</Text>
              <Text style={styles.summaryValue}>{formatNumber(data.summary.totalQty)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.infoLabel}>Baris Item</Text>
              <Text style={styles.summaryValue}>{formatNumber(data.summary.totalItems)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.infoLabel}>Total Upah</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.summary.totalUpah)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Pekerjaan</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.cellDate, styles.headerText]}>Tanggal</Text>
              <Text style={[styles.cellProduct, styles.headerText]}>Produk</Text>
              <Text style={[styles.cellQty, styles.headerText]}>Qty</Text>
              <Text style={[styles.cellUnit, styles.headerText]}>Upah Satuan</Text>
              <Text style={[styles.cellTotal, styles.headerText]}>Subtotal</Text>
            </View>
            {data.records.length ? (
              data.records.flatMap((record) =>
                record.items.map((item, itemIndex) => (
                  <View
                    key={`${record.id}-${item.id}`}
                    style={
                      record === data.records[data.records.length - 1] &&
                      itemIndex === record.items.length - 1
                        ? [styles.tableRow, styles.tableRowLast]
                        : styles.tableRow
                    }
                  >
                    <Text style={styles.cellDate}>{formatDateOnly(record.tanggal)}</Text>
                    <Text style={styles.cellProduct}>{item.product.namaProduk}</Text>
                    <Text style={styles.cellQty}>{formatNumber(item.qty)}</Text>
                    <Text style={styles.cellUnit}>
                      {formatCurrency(getSnapshotUnitUpah(item.qty, item.upah))}
                    </Text>
                    <Text style={styles.cellTotal}>{formatCurrency(item.upah)}</Text>
                  </View>
                )),
              )
            ) : (
              <View style={[styles.tableRow, styles.tableRowLast]}>
                <Text style={[styles.cellDate, { width: "100%", textAlign: "center" }]}>
                  Tidak ada data pada periode ini.
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.footer}>
          Dokumen ini dibuat otomatis dari sistem {APP_NAME}. Nominal mengikuti snapshot record
          kinerja pada periode yang dipilih.
        </Text>
      </Page>
    </Document>
  );
}

export async function buildSlipPdfBuffer(data: EmployeeSlipData) {
  return renderToBuffer(<SlipDocument data={data} />);
}
