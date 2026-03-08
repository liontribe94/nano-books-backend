const supabase = require('../../config/supabase');

class InventoryRepository {
    async createProduct(data) {
        const { data: inserted, error } = await supabase
            .from('products')
            .insert([data])
            .select()
            .single();

        if (error) {
            console.error('Database Error in createProduct:', error);
            throw new Error(error.message);
        }
        return inserted;
    }

    async findProductById(id) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data; // Supabase returns the object directly
    }

    async findProductsByCompany(companyId, filters = {}) {
        let query = supabase
            .from('products')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_deleted', false);

        // Add more filters as needed (category, low stock, etc.)

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return data;
    }

    async updateProduct(id, data) {
        const { data: updated, error } = await supabase
            .from('products')
            .update(data)
            .eq('id', id)
            .select() // Need to select to return data
            .single();

        if (error) throw new Error(error.message);
        return updated;
    }

    async recordMovement(data) {
        // Map to snake_case table name if strictly following convention, 
        // but let's stick to what I decided: inventory_movements
        const { data: inserted, error } = await supabase
            .from('inventory_movements')
            .insert([data])
            .select()
            .single();

        if (error) {
            console.error('Database Error in recordMovement:', error);
            throw new Error(error.message);
        }
        return inserted;
    }

    async getStockHistory(productId, companyId, limit = 50) {
        const { data, error } = await supabase
            .from('inventory_movements')
            .select('*')
            .eq('company_id', companyId)
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw new Error(error.message);
        return data;
    }
}

module.exports = new InventoryRepository();
