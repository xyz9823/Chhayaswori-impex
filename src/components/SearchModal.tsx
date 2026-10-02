import React, { useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { CatalogProduct } from '../types/store.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: CatalogProduct[];
  onOpenProduct: (slug: string) => void;
  onViewAllSearchResults: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onOpenProduct,
  onViewAllSearchResults,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

  const matched = tokens.length === 0
    ? []
    : products.filter((p) => {
        const text = [
          p.name,
          p.sku,
          p.categorySlug,
          p.subcategory,
          p.productType,
          p.gender,
          p.brand,
          p.shortDescription,
          ...(p.tagsList || []),
          ...(p.colors || []),
          ...(p.sizes || []),
        ]
          .join(' ')
          .toLowerCase();
        return tokens.every((t) => text.includes(t));
      }).slice(0, 5);

  const quickSuggestions = [
    'Black Slipper',
    'Comfort Slides',
    'Walking Shoe',
    'Leather Sandal',
    'Men Size 41',
    'Women Slides',
    'Kids Sandal',
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 md:p-12 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white border border-neutral-200 overflow-hidden shadow-2xl mt-4 sm:mt-12">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                onClose();
                onViewAllSearchResults(query.trim());
              }
            }}
            placeholder="Search footwear name, SKU, black slipper, size 41..."
            className="w-full text-sm sm:text-base text-neutral-950 placeholder:text-neutral-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-950"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs uppercase tracking-wider text-neutral-500 hover:text-neutral-950 pl-2 border-l border-neutral-200"
          >
            Esc
          </button>
        </div>

        {/* Suggestions or Results */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {q ? (
            matched.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-neutral-950">
                  No products found for “{query}”.
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Try searching for slippers, walking shoes, sandals, or sizes 40–44.
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-3">
                  Matching Products ({matched.length})
                </span>
                <div className="divide-y divide-neutral-100">
                  {matched.map((prod) => (
                    <div
                      key={prod.uuid}
                      onClick={() => {
                        onClose();
                        onOpenProduct(prod.slug);
                      }}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 px-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.primaryImage}
                          alt={prod.name}
                          className="w-12 h-12 object-cover bg-neutral-100 border border-neutral-200"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-950">
                            {prod.name}
                          </h4>
                          <p className="text-[11px] text-neutral-500">
                            {prod.gender} · {prod.productType} · SKU: {prod.sku}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-semibold text-neutral-950">
                          Rs. {prod.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewAllSearchResults(query);
                  }}
                  className="mt-4 w-full py-2.5 border border-neutral-300 text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:bg-neutral-950 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  View All Search Results <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          ) : (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-3">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setQuery(sug);
                      onViewAllSearchResults(sug);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs bg-neutral-100 hover:bg-neutral-950 hover:text-white text-neutral-800 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
