import PayoutSchedule from "@/components/payouts/PayoutSchedule";

// 1. Make the function async
export default async function PayoutsPage({ 
  params 
}: { 
  params: Promise<{ groupId: string }> // 2. Define params as a Promise
}) {
  // 3. Await the params before destructuring
  const { groupId } = await params; 

  // In your Viva, explain that 'Admin' is currently hardcoded for testing UAT 2
  const currentUserRole = "Admin"; 

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-10">
      <PayoutSchedule 
        groupId={groupId} 
        userRole={currentUserRole} 
      />
    </div>
  );
}