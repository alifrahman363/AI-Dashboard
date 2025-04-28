import { PaginateType } from "../types/paginationType";

export const paginate = ({ page, limit, total_items }: PaginateType) => {
    const pageTotal = Math.ceil(total_items / limit);
    return {
        total: total_items,
        per_page: limit,
        total_pages: pageTotal,
        current_page: page,
    };
};
