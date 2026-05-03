import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) return NextResponse.json({ error: "Missing Group ID" }, { status: 400 });

  try {
    const q = query(collection(db, "contributions"), where("groupId", "==", groupId));
    const querySnapshot = await getDocs(q);

    let totalAmount = 0;
    const monthlyData: Record<string, number> = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalAmount += data.amount || 0;

      // Grouping for a chart (e.g., "April 2026")
      const date = new Date(data.timestamp?.seconds * 1000 || Date.now());
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + (data.amount || 0);
    });

    return NextResponse.json({
      totalPool: totalAmount,
      chartData: Object.entries(monthlyData).map(([name, total]) => ({ name, total })),
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to aggregate data" }, { status: 500 });
  }
}