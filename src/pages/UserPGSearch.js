import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import {
  HeroBanner,
  WhyChooseSection,
  LocationBanner,
  QuickFilters,
  PopularAreas,
  FilterBar,
  BudgetFilterModal,
  PropertyCard,
  QuickViewModal,
  BookingModal,
  CompareModal,
  EmptyState,
  LoadingState,
  LoadingMoreState,
  PropertyTabs,
  StickyContactButton,
  LocationInfoBar,
  ResultsHeader,
  Notification,
} from '../components';

import { useFavorites } from '../hooks/useFavorites';
import { useLocation } from '../hooks/useLocation';
import { useNotification } from '../hooks/useNotification';
import { useIsMobile } from '../hooks/useMediaQuery';

import { quickFilters, propertyTabs } from '../data/constants';
import { processPGData, getEffectiveRent, getDistanceKm, trackEvent } from '../lib/utils';

import { FilterState, PGProperty } from '../types';

// Simple API mock - replace with actual api import
const api = {
  get: async (url: string) => {
    // This is a placeholder - in real app, use your actual API
    console.log('API GET:', url);
    return { data: { data: [], hasMore: false, total: 0 } };
  },
  post: async (url: string, data: any, config?: any) => {
    console.log('API POST:', url, data);
    return { data: { message: 'Success' } };
  },
};

const PAGE_SIZE = 12;

function UserPGSearch() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { userLocation, userAddress, isLoading: locationLoading, detectLocation } = useLocation();
  const { notification, showNotification, clearNotification } = useNotification();

  const [allPGs, setAllPGs] = useState<PGProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [quickViewPG, setQuickViewPG] = useState<PGProperty | null>(null);
  const [bookingPG, setBookingPG] = useState<PGProperty | null>(null);
  const [showLocationBanner, setShowLocationBanner] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<number>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<FilterState>({
    location: '',
    minBudget: 0,
    maxBudget: 50000,
    food: false,
    ac: false,
    wifi: false,
    parking: false,
    sort: '',
    nearMe: false,
    foodType: '',
  });

  // Load PGs
  const loadPGs = async (pageToLoad = 1, isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      let url = `/pg/search/advanced?page=${pageToLoad}&limit=${PAGE_SIZE}`;

      let sortParam = 'relevance';
      if (filters.sort === 'low') sortParam = 'price_low';
      else if (filters.sort === 'high') sortParam = 'price_high';
      else if (filters.sort === 'new') sortParam = 'newest';
      else if (filters.sort === 'distance' && userLocation) sortParam = 'nearest';
      url += `&sort_by=${sortParam}`;

      if (filters.location) {
        url += `&search=${encodeURIComponent(filters.location)}`;
      }

      if (userLocation && filters.nearMe) {
        url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
      }

      const response = await api.get(url);

      if (response.data?.data) {
        let rawData = response.data.data;

        if (userLocation) {
          rawData = rawData.map((pg: PGProperty) => {
            if (pg.latitude && pg.longitude) {
              const distance = getDistanceKm(userLocation.lat, userLocation.lng, pg.latitude, pg.longitude);
              return { ...pg, distance };
            }
            return pg;
          });
        }

        const processedData = processPGData(rawData);

        if (!isLoadMore || pageToLoad === 1) {
          setAllPGs(processedData);
        } else {
          setAllPGs(prev => [...prev, ...processedData]);
        }

        setHasMorePages(response.data.hasMore === true);
        setTotalCount(response.data.total || 0);
        setCurrentPage(pageToLoad);
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading PGs:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const resetAndFetch = useCallback(() => {
    setCurrentPage(1);
    loadPGs(1, false);
  }, []);

  const loadMoreProperties = useCallback(() => {
    if (!loadingMore && hasMorePages && !loading) {
      const nextPage = currentPage + 1;
      loadPGs(nextPage, true);
    }
  }, [loadingMore, hasMorePages, loading, currentPage]);

  // Apply quick filter
  const applyQuickFilter = useCallback((filterId: string) => {
    const filter = quickFilters.find(f => f.id === filterId);
    if (!filter) return;

    const newActiveFilters = new Set(activeQuickFilters);

    if (newActiveFilters.has(filterId)) {
      newActiveFilters.delete(filterId);
      if (filter.type === 'location') {
        setFilters(prev => ({ ...prev, nearMe: false }));
      } else if (filter.type === 'food') {
        setFilters(prev => ({ ...prev, foodType: '' }));
      } else if (filter.type === 'amenity' && filter.field) {
        setFilters(prev => ({ ...prev, [filter.field!]: false }));
      }
    } else {
      newActiveFilters.add(filterId);
      if (filter.type === 'location') {
        setFilters(prev => ({ ...prev, nearMe: true, sort: 'distance' }));
        detectLocation();
      } else if (filter.type === 'food' && filter.value) {
        setFilters(prev => ({ ...prev, foodType: filter.value! }));
      } else if (filter.type === 'amenity' && filter.field) {
        setFilters(prev => ({ ...prev, [filter.field!]: true }));
      }
    }

    setActiveQuickFilters(newActiveFilters);
    showNotification(`${newActiveFilters.has(filterId) ? 'Applied' : 'Removed'} ${filter.name}`);
    resetAndFetch();
  }, [activeQuickFilters, detectLocation, resetAndFetch, showNotification]);

  // Handle search from hero
  const handleHeroSearch = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, location: searchQuery }));
    resetAndFetch();
  }, [resetAndFetch]);

  // Filter by area
  const filterByArea = useCallback((area: string) => {
    const newLocation = filters.location === area ? '' : area;
    setFilters(prev => ({ ...prev, location: newLocation, nearMe: false }));
    showNotification(`${newLocation ? 'Showing' : 'Removed filter for'} properties in ${area}`);
    trackEvent('area_filter_click', { area });
    resetAndFetch();
  }, [filters.location, resetAndFetch, showNotification]);

  // Handle budget change
  const handleBudgetChange = useCallback((min: number, max: number) => {
    setFilters(prev => ({ ...prev, minBudget: min, maxBudget: max }));
    showNotification(`Budget set: ₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`);
    resetAndFetch();
  }, [resetAndFetch, showNotification]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      location: '', minBudget: 0, maxBudget: 50000, food: false, ac: false,
      wifi: false, parking: false, sort: '', nearMe: false, foodType: ''
    });
    setActiveQuickFilters(new Set());
    showNotification('All filters reset');
    resetAndFetch();
  }, [resetAndFetch, showNotification]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    resetAndFetch();
  }, [resetAndFetch]);

  // Handle near me
  const handleNearMe = useCallback(() => {
    if (!filters.nearMe) {
      detectLocation();
    }
    setFilters(prev => ({ ...prev, nearMe: !prev.nearMe, sort: !prev.nearMe ? 'distance' : prev.sort }));
    resetAndFetch();
  }, [filters.nearMe, detectLocation, resetAndFetch]);

  // Handle quick view
  const handleQuickView = useCallback((pg: PGProperty) => {
    setQuickViewPG(pg);
  }, []);

  // Handle book now
  const handleBookNow = useCallback((pg: PGProperty) => {
    setBookingPG(pg);
  }, []);

  // Handle booking submit
  const handleBookingSubmit = useCallback(async (bookingData: { roomType: string }) => {
    try {
      const payload = { room_type: bookingData.roomType };
      const res = await api.post(`/bookings/${bookingPG?.id}`, payload);
      showNotification(res.data.message || 'Owner will contact you shortly');
      setBookingPG(null);
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'Something went wrong', true);
    }
  }, [bookingPG, showNotification]);

  // Handle card click
  const handleCardClick = useCallback((pg: PGProperty) => {
    navigate(`/pg/${pg.id}`);
  }, [navigate]);

  // Toggle compare mode
  const toggleCompareMode = useCallback(() => {
    setCompareMode(prev => {
      if (prev) setSelectedForCompare(new Set());
      return !prev;
    });
  }, []);

  // Toggle select for compare
  const toggleSelectForCompare = useCallback((pgId: number) => {
    setSelectedForCompare(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(pgId)) {
        newSelected.delete(pgId);
      } else if (newSelected.size < 3) {
        newSelected.add(pgId);
      } else {
        showNotification('You can compare up to 3 properties at a time');
        return prev;
      }
      return newSelected;
    });
  }, [showNotification]);

  // Handle compare
  const handleCompare = useCallback(() => {
    if (selectedForCompare.size < 2) {
      showNotification('Please select at least 2 properties to compare');
      return;
    }
    setShowCompareModal(true);
  }, [selectedForCompare.size, showNotification]);

  // Handle save favorite
  const handleSaveFavorite = useCallback((pgId: number, isFav: boolean) => {
    if (isFav && !favorites.has(pgId)) {
      toggleFavorite(pgId);
    } else if (!isFav && favorites.has(pgId)) {
      toggleFavorite(pgId);
    }
  }, [favorites, toggleFavorite]);

  // Apply filters
  const applyFilters = useCallback((data: PGProperty[]) => {
    let filtered = [...data];

    if (filters.location) {
      filtered = filtered.filter((pg) =>
        `${pg.area || ''} ${pg.city || ''} ${pg.pg_name || ''}`.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    filtered = filtered.filter((pg) => {
      const rent = getEffectiveRent(pg);
      return rent >= filters.minBudget && rent <= filters.maxBudget;
    });

    if (filters.food) filtered = filtered.filter((pg) => pg.food_available === true);
    if (filters.ac) filtered = filtered.filter((pg) => pg.ac_available === true);
    if (filters.wifi) filtered = filtered.filter((pg) => pg.wifi_available === true);
    if (filters.parking) filtered = filtered.filter((pg) => pg.parking_available === true);
    if (filters.foodType) filtered = filtered.filter((pg) => pg.food_type === filters.foodType);

    if (filters.sort === 'low') {
      filtered.sort((a, b) => getEffectiveRent(a) - getEffectiveRent(b));
    } else if (filters.sort === 'high') {
      filtered.sort((a, b) => getEffectiveRent(b) - getEffectiveRent(a));
    } else if (filters.sort === 'new') {
      filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else if (filters.sort === 'distance' && userLocation) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    return filtered;
  }, [filters, userLocation]);

  // Get filtered by tab
  const getFilteredByTab = useCallback((data: PGProperty[]) => {
    const allFiltered = applyFilters(data);
    if (activeTab === 'all') return allFiltered;
    return allFiltered.filter(item => item.pg_category === activeTab);
  }, [applyFilters, activeTab]);

  const filteredPGs = getFilteredByTab(allPGs);
  const resultCount = filteredPGs.length;

  // Get title based on active tab
  const getTabTitle = () => {
    switch (activeTab) {
      case 'pg': return 'PG Accommodations';
      case 'coliving': return 'Co-Living Spaces';
      case 'to_let': return 'To-Let Homes';
      default: return 'All Properties';
    }
  };

  // Check if filters are active
  const hasActiveFilters = filters.location !== '' ||
    filters.minBudget > 0 ||
    filters.maxBudget < 50000 ||
    filters.food ||
    filters.ac ||
    filters.wifi ||
    filters.parking ||
    filters.foodType !== '' ||
    activeQuickFilters.size > 0;

  // Initial load
  useEffect(() => {
    resetAndFetch();
  }, []);

  return (
    <div className="max-w-7xl mx-auto min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            isError={notification.isError}
            onClose={clearNotification}
          />
        )}
      </AnimatePresence>

      {/* Location Permission Banner */}
      {showLocationBanner && !userLocation && (
        <LocationBanner
          userAddress={userAddress}
          isLoading={locationLoading}
          onAllow={() => {
            detectLocation();
            setShowLocationBanner(false);
          }}
          onDeny={() => setShowLocationBanner(false)}
        />
      )}

      {/* Hero Banner with Search */}
      <HeroBanner onSearch={handleHeroSearch} />

      {/* Why Choose Nepxall */}
      <WhyChooseSection />

      {/* Location Info Bar */}
      {userLocation && (
        <LocationInfoBar
          userAddress={userAddress}
          isLoading={locationLoading}
          onRefresh={detectLocation}
        />
      )}

      {/* Quick Filters */}
      <QuickFilters
        activeFilters={activeQuickFilters}
        onToggle={applyQuickFilter}
      />

      {/* Popular Areas */}
      <PopularAreas
        selectedArea={filters.location}
        onSelect={filterByArea}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onBudgetClick={() => setShowBudgetFilter(true)}
        onNearMe={handleNearMe}
        onCompareToggle={toggleCompareMode}
        onReset={resetFilters}
        compareMode={compareMode}
        hasActiveFilters={hasActiveFilters}
        userLocation={!!userLocation}
      />

      {/* Property Tabs */}
      <PropertyTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Results Header */}
      <ResultsHeader
        title={getTabTitle()}
        count={resultCount}
        compareMode={compareMode}
        selectedCount={selectedForCompare.size}
        onCompare={handleCompare}
      />

      {/* Properties Grid */}
      {loading ? (
        <LoadingState />
      ) : filteredPGs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPGs.map((pg, index) => (
              <PropertyCard
                key={pg.id}
                pg={pg}
                onQuickView={handleQuickView}
                onFavorite={toggleFavorite}
                onContact={handleBookNow}
                onCardClick={handleCardClick}
                isFavorite={isFavorite(pg.id)}
                isSelectedForCompare={selectedForCompare.has(pg.id)}
                onSelectForCompare={toggleSelectForCompare}
                compareMode={compareMode}
                index={index}
              />
            ))}
          </div>

          {/* Load More */}
          {!loading && hasMorePages && !loadingMore && filteredPGs.length > 0 && filteredPGs.length < totalCount && (
            <div className="text-center mt-10 mb-16">
              <button
                onClick={loadMoreProperties}
                disabled={loadingMore}
                className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-semibold
                           hover:bg-primary-700 transition-all disabled:opacity-70
                           shadow-glow hover:shadow-strong inline-flex items-center gap-2"
              >
                Load More Properties
              </button>
            </div>
          )}

          {loadingMore && <LoadingMoreState />}
        </>
      ) : (
        <EmptyState onReset={resetFilters} />
      )}

      {/* Modals */}
      {showBudgetFilter && (
        <BudgetFilterModal
          minBudget={filters.minBudget}
          maxBudget={filters.maxBudget}
          onBudgetChange={handleBudgetChange}
          onClose={() => setShowBudgetFilter(false)}
        />
      )}

      {quickViewPG && (
        <QuickViewModal
          pg={quickViewPG}
          onClose={() => setQuickViewPG(null)}
          onBook={handleBookNow}
          onSaveFavorite={handleSaveFavorite}
        />
      )}

      {bookingPG && (
        <BookingModal
          pg={bookingPG}
          onClose={() => setBookingPG(null)}
          onBook={handleBookingSubmit}
        />
      )}

      {showCompareModal && (
        <CompareModal
          selectedPGs={selectedForCompare}
          allPGs={allPGs}
          onClose={() => {
            setShowCompareModal(false);
            setSelectedForCompare(new Set());
            setCompareMode(false);
          }}
        />
      )}

      {/* Sticky Contact Button for Mobile */}
      {isMobile && !compareMode && filteredPGs.length > 0 && (
        <StickyContactButton
          pg={filteredPGs[0]}
          onContact={handleBookNow}
        />
      )}
    </div>
  );
}

export default UserPGSearch;
