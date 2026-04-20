import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

export async function GET(req: NextRequest) {
  try {
    const contributionsRef = collection(db, "contributions");
    const snapshot = await getDocs(contributionsRef);
    const contributions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ contributions });
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { contributionId, status, confirmedBy } = body;

    if (!contributionId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const contributionRef = doc(db, "contributions", contributionId);
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === "confirmed" && confirmedBy) {
      updateData.confirmedBy = confirmedBy;
      updateData.confirmedAt = new Date().toISOString();
    }

    await updateDoc(contributionRef, updateData);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating contribution:", error);
    return NextResponse.json({ error: "Failed to update contribution" }, { status: 500 });
  }
}
