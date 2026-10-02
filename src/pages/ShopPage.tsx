import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import { CatalogProduct, CategoryItem } from '../types/store.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface ShopPageProps {
  products: CatalogProduct[];
  categories: CategoryItem[];
  initialCategorySlug: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  wishlistIds: number[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onToggleWishlist: (productId: number, e: React.MouseEvent) => void;
  onQuickView: (product: CatalogProduct, e: React.MouseEvent) => void;
  onOpenProduct: (slug: string) => void;
  onNavigateHome: () => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories,
  initialCategorySlug,
  searchQuery,
  onSearchChange,
  wishlistIds,
  loading,
  error,
  onRetry,
  onToggleWishlist,
  onQuickView,
  onOpenProduct,
  onNavigateHome,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategorySlug || 'all'
  );
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [onlyDiscounted, setOnlyDiscounted] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  // Sync external category changes
  React.useEffect(() => {
    setSelectedCategory(initialCategorySlug || 'all');
  }, [initialCategorySlug]);

  // Extract available sizes and colors from the immutable source products array
  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [products]);

  const allColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [products]);

  // 19 & 20. DERIVED VIEW ONLY — NEVER MUTATES ORIGINAL `products` DATASET
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    const matched = products.filter((p) => {
      // 1. Search across Name, SKU, Category, Product Type, Gender, Brand, Description, Tags, Color, Size
      if (tokens.length > 0) {
        const searchableBlob = [
          p.name,
          p.sku,
          p.categorySlug,
          p.subcategory,
          p.productType,
          p.gender,
          p.brand,
          p.shortDescription,
          p.fullDescription,
          ...(p.tagsList || []),
          ...(p.colors || []),
          ...(p.sizes || []),
        ]
          .join(' ')
          .toLowerCase();

        const matchesAllTokens = tokens.every((tok) =>
          searchableBlob.includes(tok)
        );
        if (!matchesAllTokens) return false;
      }

      // 2. Category / Special Filter
      if (selectedCategory && selectedCategory !== 'all') {
        if (selectedCategory === 'sale') {
          if (!p.isOnSale && p.discountPercent <= 0) return false;
        } else if (selectedCategory === 'comfort') {
          if (!p.isComfortCollection && p.categorySlug !== 'comfort')
            return false;
        } else if (selectedCategory === 'shoes') {
          if (
            p.productType.toLowerCase() !== 'shoes' &&
            p.categorySlug !== 'shoes'
          )
            return false;
        } else if (selectedCategory === 'slippers') {
          if (
            p.productType.toLowerCase() !== 'slippers' &&
            p.categorySlug !== 'slippers'
          )
            return false;
        } else if (selectedCategory === 'sandals') {
          if (
            p.productType.toLowerCase() !== 'sandals' &&
            p.categorySlug !== 'sandals'
          )
            return false;
        } else if (
          p.categorySlug.toLowerCase() !== selectedCategory.toLowerCase() &&
          p.gender.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }
      }

      // 3. Gender
      if (
        selectedGender !== 'all' &&
        p.gender.toLowerCase() !== selectedGender.toLowerCase()
      ) {
        return false;
      }

      // 4. Product Type
      if (
        selectedType !== 'all' &&
        p.productType.toLowerCase() !== selectedType.toLowerCase()
      ) {
        return false;
      }

      // 5. Size
      if (selectedSize !== 'all' && !p.sizes.includes(selectedSize)) {
        return false;
      }

      // 6. Color
      if (
        selectedColor !== 'all' &&
        !p.colors.some((c) => c.toLowerCase() === selectedColor.toLowerCase())
      ) {
        return false;
      }

      // 7. Price
      if (p.price > maxPrice) return false;

      // 8. Discount
      if (onlyDiscounted && p.discountPercent <= 0) return false;

      // 9. Availability
      if (onlyInStock && p.totalStock <= 0) return false;

      // 10. Rating
      if (minRating > 0 && p.ratingAvg < minRating) return false;

      return true;
    });

    // Non-mutating sort (`[...matched].sort(...)`)
    return [...matched].sort((a, b) => {
      if (sortBy === 'newest') {
        const timeB = new Date(b.createdAt).getTime();
        const timeA = new Date(a.createdAt).getTime();
        if (timeB !== timeA) return timeB - timeA;
        if (b.isNewArrival !== a.isNewArrival) return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        return b.id - a.id;
      }
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'popular') return b.viewsCount - a.viewsCount;
      if (sortBy === 'rating') return b.ratingAvg - a.ratingAvg;
      return 0;
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedGender,
    selectedType,
    selectedSize,
    selectedColor,
    maxPrice,
    onlyDiscounted,
    onlyInStock,
    minRating,
    sortBy,
  ]);

  const resetAllFilters = () => {
    onSearchChange('');
    setSelectedCategory('all');
    setSelectedGender('all');
    setSelectedType('all');
    setSelectedSize('all');
    setSelectedColor('all');
    setMaxPrice(10000);
    setOnlyDiscounted(false);
    setOnlyInStock(false);
    setMinRating(0);
    setSortBy('relevance');
  };

  const renderFilterControls = () => (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-950">
          Filters & Sort
        </span>
        <button
          type="button"
          onClick={resetAllFilters}
          className="text-xs text-neutral-500 hover:text-neutral-950 inline-flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset All
        </button>
      </div>

      {/* Sort By Dropdown Filter */}
      <div>
        <label
          htmlFor="sidebar-sort-select"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2.5"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-800" />
          <span>Sort Products</span>
        </label>
        <select
          id="sidebar-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort products by price or arrivals"
          className="w-full px-3 py-2 text-xs border border-neutral-300 bg-white text-neutral-900 focus:border-neutral-950 focus:outline-none transition-colors"
        >
          <option value="relevance">Featured & Relevant</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest Arrivals</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2.5">
          Collection
        </h4>
        <div className="space-y-1.5">
          {[
            { label: 'All Collections', slug: 'all' },
            ...categories.map((c) => ({ label: c.name, slug: c.slug })),
            { label: 'Special Offers', slug: 'sale' },
          ].map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setSelectedCategory(c.slug)}
              className={`block w-full text-left py-1 text-xs transition-colors ${
                selectedCategory === c.slug
                  ? 'font-bold text-neutral-950 underline'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2.5">
          Gender
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'Men', 'Women', 'Kids', 'Unisex'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGender(g)}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                selectedGender === g
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
              }`}
            >
              {g === 'all' ? 'All' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Product Type */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2.5">
          Footwear Type
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'Shoes', 'Slippers', 'Sandals'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 text-xs border transition-colors ${
                selectedType === t
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
              }`}
            >
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2.5">
          Size
        </h4>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSize('all')}
            className={`py-1.5 text-xs font-mono border ${
              selectedSize === 'all'
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-200 text-neutral-700'
            }`}
          >
            All
          </button>
          {allSizes.map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => setSelectedSize(sz)}
              className={`py-1.5 text-xs font-mono border ${
                selectedSize === sz
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-950 mb-2.5">
          Color
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedColor('all')}
            className={`px-2.5 py-1 text-xs border ${
              selectedColor === 'all'
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-200 text-neutral-700'
            }`}
          >
            All
          </button>
          {allColors.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setSelectedColor(col)}
              className={`px-2.5 py-1 text-xs border ${
                selectedColor === col
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 text-neutral-700 hover:border-neutral-400'
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Max Price Slider */}
      <div>
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold uppercase tracking-wider text-neutral-950">
            Max Price
          </span>
          <span className="font-mono">Rs. {maxPrice.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={500}
          max={10000}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-neutral-950"
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-2 pt-2 border-t border-neutral-200">
        <label className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="accent-neutral-950"
          />
          <span>In Stock Only</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyDiscounted}
            onChange={(e) => setOnlyDiscounted(e.target.checked)}
            className="accent-neutral-950"
          />
          <span>On Sale / Discounted</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* 45. BREADCRUMBS */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs text-neutral-500 mb-6"
      >
        <button
          type="button"
          onClick={onNavigateHome}
          className="hover:text-neutral-950"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className="hover:text-neutral-950"
        >
          Shop
        </button>
        {selectedCategory !== 'all' && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-neutral-950 font-medium capitalize">
              {selectedCategory}
            </span>
          </>
        )}
      </nav>

      {/* Top Header & Search + Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-950 uppercase tracking-tight">
            {selectedCategory === 'all'
              ? 'ALL FOOTWEAR COLLECTIONS'
              : `${selectedCategory.toUpperCase()} COLLECTION`}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, SKU, black slipper, size..."
              aria-label="Search catalog"
              className="w-full pl-9 pr-8 py-2.5 text-xs border border-neutral-300 focus:border-neutral-950 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-950"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden px-3.5 py-2.5 border border-neutral-300 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>

          {/* Sort Dropdown Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="shop-sort-dropdown"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-700 whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-900" />
              <span>Sort:</span>
            </label>
            <select
              id="shop-sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products by price or newest arrivals"
              className="px-3.5 py-2.5 border border-neutral-300 text-xs font-medium bg-white text-neutral-900 focus:border-neutral-950 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="relevance">Featured & Relevant</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Arrivals</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Desktop Sidebar + Responsive Product Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="hidden lg:block lg:col-span-3">
          {renderFilterControls()}
        </aside>

        <div className="lg:col-span-9">
          {/* 22. STRICT SEPARATION OF LOADING / ERROR / EMPTY STATES */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="border border-neutral-200 p-4 animate-pulse"
                >
                  <div className="aspect-[4/3] bg-neutral-200 mb-4" />
                  <div className="h-3 bg-neutral-200 w-1/3 mb-2" />
                  <div className="h-4 bg-neutral-200 w-3/4 mb-4" />
                  <div className="h-4 bg-neutral-200 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="border border-neutral-200 bg-[#F9F9F8] p-12 text-center">
              <p className="text-sm font-medium text-neutral-950">
                Unable to load products. Please try again.
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="border border-neutral-200 bg-[#F9F9F8] p-12 text-center">
              <p className="text-base font-display font-bold text-neutral-950">
                No products found.
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Try clearing your search query or adjusting the size and price
                filters.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-5 px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.uuid}
                  product={product}
                  isWishlisted={wishlistIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                  onQuickView={onQuickView}
                  onOpenProduct={onOpenProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end lg:hidden">
          <div className="w-80 max-w-full bg-white h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-display font-bold uppercase">
                Filter Products
              </h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFilterControls()}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-8 w-full py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-widest"
            >
              Show {filteredProducts.length} Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
