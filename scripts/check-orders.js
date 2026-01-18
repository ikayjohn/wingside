const { createAdminClient } = require('../lib/supabase/admin.ts');

async function checkOrders() {
  const admin = createAdminClient();

  // Get recent orders
  const { data, error } = await admin
    .from('orders')
    .select('id, status, total, customer_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== Recent Orders ===');
  console.table(data);

  // Get unique statuses
  const { data: allOrders } = await admin
    .from('orders')
    .select('status');

  const uniqueStatuses = [...new Set(allOrders?.map(s => s.status) || [])];
  console.log('\n=== Unique Statuses ===', uniqueStatuses);

  // Count by status
  const statusCounts = {};
  allOrders?.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });
  console.log('\n=== Orders by Status ===');
  console.table(statusCounts);

  // Calculate total revenue for each status
  const revenueByStatus = {};
  allOrders?.forEach(order => {
    if (!revenueByStatus[order.status]) {
      revenueByStatus[order.status] = { count: 0, total: 0 };
    }
    revenueByStatus[order.status].count++;
    revenueByStatus[order.status].total += order.total || 0;
  });
  console.log('\n=== Revenue by Status ===');
  Object.entries(revenueByStatus).forEach(([status, data]) => {
    console.log(`${status}: ${data.count} orders, ₦${data.total.toLocaleString()}`);
  });
}

checkOrders().catch(console.error);
