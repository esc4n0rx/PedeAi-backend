// src/controllers/dashboard.controller.js
import { supabase } from "../config/supabase.js";

export const getDashboardInsights = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Buscar a loja do usuário
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (storeError || !store) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }
    
    const storeId = store.id;
    
    // Datas para filtros
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    
    // 1. Pedidos Totais
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);
    
    // 2. Pedidos de hoje
    const { count: todayOrders, error: todayOrdersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', today.toISOString());
    
    // 3. Pedidos da semana passada (para calcular o percentual de crescimento)
    const { count: lastWeekOrders, error: lastWeekOrdersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', lastWeekStart.toISOString())
      .lt('created_at', today.toISOString());
    
    // 4. Pedidos pendentes
    const { count: pendingOrders, error: pendingOrdersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .in('status', ['em_processamento', 'em_preparacao']);
    
    // 5. Faturamento total
    const { data: totalRevenue, error: revenueError } = await supabase
      .from('orders')
      .select('total')
      .eq('store_id', storeId)
      .in('status', ['em_preparacao', 'em_rota', 'finalizado']);
    
    // 6. Faturamento da semana atual
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Início da semana (domingo)
    
    const { data: weekRevenue, error: weekRevenueError } = await supabase
      .from('orders')
      .select('total')
      .eq('store_id', storeId)
      .gte('created_at', weekStart.toISOString())
      .in('status', ['em_preparacao', 'em_rota', 'finalizado']);
    
    // 7. Faturamento da semana anterior (para calcular o percentual)
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);
    prevWeekEnd.setMilliseconds(prevWeekEnd.getMilliseconds() - 1);
    
    const { data: prevWeekRevenue, error: prevWeekRevenueError } = await supabase
      .from('orders')
      .select('total')
      .eq('store_id', storeId)
      .gte('created_at', prevWeekStart.toISOString())
      .lt('created_at', prevWeekEnd.toISOString())
      .in('status', ['em_preparacao', 'em_rota', 'finalizado']);
    
    // 8. Total de clientes
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);
    
    // 9. Novos clientes da semana
    const { count: newWeekCustomers, error: newCustomersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', weekStart.toISOString());
    
    // 10. Novos clientes da semana anterior (para calcular o percentual)
    const { count: prevWeekNewCustomers, error: prevWeekNewCustomersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', prevWeekStart.toISOString())
      .lt('created_at', weekStart.toISOString());
    
    // 11. Dados para o gráfico de vendas da semana
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const salesByDay = [];
    
    // Preencher o array com os dias da semana
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      
      // Buscar vendas do dia
      const { data: daySales, error: daySalesError } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', storeId)
        .gte('created_at', day.toISOString())
        .lt('created_at', nextDay.toISOString())
        .in('status', ['em_preparacao', 'em_rota', 'finalizado']);
      
      if (daySalesError) {
        console.error(`Erro ao buscar vendas do dia ${daysOfWeek[i]}:`, daySalesError);
      }
      
      const totalSales = daySales?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      
      salesByDay.push({
        day: daysOfWeek[i],
        value: parseFloat(totalSales.toFixed(2))
      });
    }
    
    // 12. Produtos mais vendidos
    const { data: topProducts, error: topProductsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        products:product_id(name),
        quantity
      `)
      .eq('orders.store_id', storeId)
      .in('orders.status', ['em_preparacao', 'em_rota', 'finalizado'])
      .order('quantity', { ascending: false })
      .limit(5);
    
    // Calcular totais
    const totalRevenueAmount = totalRevenue?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const weekRevenueAmount = weekRevenue?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const prevWeekRevenueAmount = prevWeekRevenue?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    
    // Calcular percentuais de crescimento
    const orderGrowth = lastWeekOrders > 0 
      ? ((todayOrders / lastWeekOrders) - 1) * 100 
      : 0;
    
    const revenueGrowth = prevWeekRevenueAmount > 0 
      ? ((weekRevenueAmount / prevWeekRevenueAmount) - 1) * 100 
      : 0;
    
    const customerGrowth = prevWeekNewCustomers > 0 
      ? ((newWeekCustomers / prevWeekNewCustomers) - 1) * 100 
      : 0;
    
    // Formatar produtos populares
    const popularProducts = topProducts?.map(item => ({
      name: item.products?.name || 'Produto sem nome',
      sales: parseInt(item.quantity) || 0
    })) || [];
    
    // Montar o objeto de resposta
    const insights = {
      ordersStats: {
        total: totalOrders || 0,
        today: todayOrders || 0,
        growth: parseFloat(orderGrowth.toFixed(1))
      },
      pendingOrders: {
        count: pendingOrders || 0,
        lastUpdate: new Date().toISOString()
      },
      revenue: {
        total: parseFloat(totalRevenueAmount.toFixed(2)),
        thisWeek: parseFloat(weekRevenueAmount.toFixed(2)),
        growth: parseFloat(revenueGrowth.toFixed(1))
      },
      customers: {
        total: totalCustomers || 0,
        newThisWeek: newWeekCustomers || 0,
        growth: parseFloat(customerGrowth.toFixed(1))
      },
      salesChart: {
        data: salesByDay,
        currentDay: daysOfWeek[today.getDay()]
      },
      popularProducts: popularProducts
    };
    
    res.status(200).json({ insights });
  } catch (err) {
    console.error("Erro ao gerar insights do dashboard:", err);
    next(err);
  }
};