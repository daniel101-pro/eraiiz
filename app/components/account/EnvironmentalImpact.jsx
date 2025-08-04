import { useState, useEffect } from 'react';
import { refreshAccessToken } from '../../utils/auth';
import { 
  Leaf, 
  TreePine, 
  Car, 
  Recycle, 
  Award, 
  Target, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Globe, 
  Sparkles, 
  Calendar,
  Star,
  CheckCircle,
  ArrowRight,
  Info,
  ChevronRight
} from 'lucide-react';

export default function EnvironmentalImpact() {
  const [impactData, setImpactData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchImpactData = async () => {
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      let res;
      try {
        res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/users/environmental-impact', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
      } catch (err) {
        if (err.cause?.status === 401) {
          try {
            token = await refreshAccessToken();
            res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/users/environmental-impact', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            });
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return;
          }
        } else {
          throw err;
        }
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch impact data');
      }
      setImpactData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactData();
  }, []);

  const getImpactLevelColor = (level) => {
    switch (level) {
      case 'Champion': return 'from-purple-500 to-pink-500';
      case 'Leader': return 'from-green-500 to-blue-500';
      case 'Contributor': return 'from-blue-500 to-green-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getImpactLevelBadge = (level) => {
    const colors = {
      'Champion': 'bg-purple-100 text-purple-800 border-purple-200',
      'Leader': 'bg-green-100 text-green-800 border-green-200',
      'Contributor': 'bg-blue-100 text-blue-800 border-blue-200',
      'Beginner': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium border ${colors[level] || colors.Beginner}`}>
        <Star className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">{level} Level</span>
        <span className="sm:hidden">{level}</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
        <p className="text-red-800 text-center text-sm sm:text-base">{error}</p>
      </div>
    );
  }

  const MetricCard = ({ title, value, unit, icon: Icon, color, description, trend }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-xs sm:text-sm">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">+{trend}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
          {value}
          <span className="text-xs sm:text-sm font-normal text-gray-500 ml-1">{unit}</span>
        </p>
        <p className="text-xs sm:text-sm font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-500 hidden sm:block">{description}</p>
      </div>
    </div>
  );

  // Modern Chart Component matching the user's design
  const ModernChart = ({ data, title }) => {
    if (!data || data.length === 0) {
      return (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
          <div className="text-center py-8 sm:py-12">
            <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Purchase Data</h4>
            <p className="text-sm text-gray-600">Start making eco-friendly purchases to see your impact!</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.carbonSaved));
    
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-500">Total sales: ₦{data.reduce((sum, d) => sum + (d.sales || 0), 0).toLocaleString()}</p>
          </div>
          <button className="flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-700">
            View more
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </button>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Carbon saved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
            <span className="text-gray-600">Total purchases</span>
          </div>
        </div>

        {/* Chart Bars */}
        <div className="space-y-4 sm:space-y-6">
          {data.map((item, index) => {
            const carbonHeight = maxValue > 0 ? (item.carbonSaved / maxValue) * 100 : 0;
            const purchaseHeight = maxValue > 0 ? (item.purchases / Math.max(...data.map(d => d.purchases))) * 100 : 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-end h-20 sm:h-24">
                  <div className="flex items-end gap-1 sm:gap-2 h-full">
                    {/* Carbon Saved Bar */}
                    <div className="w-6 sm:w-8 bg-gray-100 rounded-t flex items-end">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all duration-700"
                        style={{ height: `${carbonHeight}%` }}
                      ></div>
                    </div>
                    {/* Total Purchases Bar */}
                    <div className="w-6 sm:w-8 bg-gray-100 rounded-t flex items-end">
                      <div 
                        className="w-full bg-gray-800 rounded-t transition-all duration-700"
                        style={{ height: `${purchaseHeight}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                      {item.carbonSaved.toFixed(1)}kg
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.purchases} purchases
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-medium text-gray-600 text-center">
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Scale */}
        <div className="mt-4 sm:mt-6 border-t border-gray-100 pt-3 sm:pt-4">
          <div className="flex justify-between text-xs text-gray-500">
            <span>₦0</span>
            <span>₦{Math.round(maxValue / 2)}k</span>
            <span>₦{Math.round(maxValue)}k</span>
          </div>
        </div>
      </div>
    );
  };

  const ChartBar = ({ label, value, maxValue, color = 'bg-green-500' }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-xs sm:text-sm">
        <span className="text-gray-700 font-medium truncate mr-2">{label}</span>
        <span className="text-gray-900 font-semibold flex-shrink-0">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
        <div 
          className={`h-2 sm:h-3 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${maxValue > 0 ? (parseFloat(value) / maxValue) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  );

  const AchievementCard = ({ achievement }) => (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="text-xs sm:text-sm md:text-base">{achievement.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{achievement.title}</h4>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{achievement.description}</p>
        </div>
        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
      </div>
    </div>
  );

  const RecommendationCard = ({ recommendation }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 hover:bg-blue-100 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="text-lg sm:text-xl">{recommendation.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-900 text-sm sm:text-base">{recommendation.title}</h4>
          <p className="text-xs sm:text-sm text-blue-700 mb-2 line-clamp-2">{recommendation.description}</p>
          {recommendation.target && (
            <div className="w-full bg-blue-200 rounded-full h-1.5 sm:h-2">
              <div 
                className="h-1.5 sm:h-2 bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((recommendation.current / recommendation.target) * 100, 100)}%` }}
              ></div>
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
              <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">Environmental Impact</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Track your contribution to a sustainable planet</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            {getImpactLevelBadge(impactData?.impactLevel)}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <MetricCard
          title="Carbon Saved"
          value={impactData?.totalCarbonSaved || 0}
          unit="kg CO₂e"
          icon={Leaf}
          color="bg-green-500"
          description="vs conventional products"
          trend={12}
        />
        <MetricCard
          title="Trees Equivalent"
          value={impactData?.impactMetrics?.treesPlanted || 0}
          unit="trees/year"
          icon={TreePine}
          color="bg-emerald-500"
          description="to offset your impact"
        />
        <MetricCard
          title="Car Rides Saved"
          value={impactData?.impactMetrics?.carRidesSaved || 0}
          unit="km"
          icon={Car}
          color="bg-blue-500"
          description="equivalent emissions"
        />
        <MetricCard
          title="Eco-Friendly Rate"
          value={impactData?.ecoFriendlyPercentage || 0}
          unit="%"
          icon={Recycle}
          color="bg-purple-500"
          description="of your purchases"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'achievements', label: 'Achievements', icon: Award },
              { id: 'recommendations', label: 'Tips', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 sm:space-y-8">
              {/* Monthly Progress Chart */}
              <ModernChart 
                data={impactData?.monthlyData || []} 
                title="Monthly Carbon Savings"
              />

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Impact by Category
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {Object.entries(impactData?.categories || {}).length > 0 ? 
                        Object.entries(impactData.categories).map(([category, data]) => (
                          <ChartBar
                            key={category}
                            label={category}
                            value={data.carbonSaved.toFixed(1)}
                            maxValue={Math.max(...Object.values(impactData?.categories || {}).map(c => c.carbonSaved))}
                            color="bg-gradient-to-r from-green-400 to-green-600"
                          />
                        )) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No category data available</p>
                          </div>
                        )
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    Material Impact
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {Object.entries(impactData?.materialImpact || {}).length > 0 ?
                        Object.entries(impactData.materialImpact).map(([material, data]) => (
                          <ChartBar
                            key={material}
                            label={material}
                            value={data.count}
                            maxValue={Math.max(...Object.values(impactData?.materialImpact || {}).map(m => m.count))}
                            color="bg-gradient-to-r from-blue-400 to-blue-600"
                          />
                        )) : (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No material data available</p>
                          </div>
                        )
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Comparison */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-green-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                  Your Environmental Impact
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm md:text-base mb-2">🌳</div>
                    <div className="text-sm sm:text-lg font-semibold text-green-600">{impactData?.impactMetrics?.treesPlanted}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Trees planted equivalent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm md:text-base mb-2">🚗</div>
                    <div className="text-sm sm:text-lg font-semibold text-blue-600">{impactData?.impactMetrics?.carRidesSaved} km</div>
                    <div className="text-xs sm:text-sm text-gray-600">Car rides avoided</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm md:text-base mb-2">♻️</div>
                    <div className="text-sm sm:text-lg font-semibold text-purple-600">{impactData?.impactMetrics?.plasticReduced} kg</div>
                    <div className="text-xs sm:text-sm text-gray-600">Plastic reduced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm md:text-base mb-2">🗑️</div>
                    <div className="text-sm sm:text-lg font-semibold text-orange-600">{impactData?.impactMetrics?.wasteAverted} kg</div>
                    <div className="text-xs sm:text-sm text-gray-600">Waste averted</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your Environmental Achievements</h3>
                <p className="text-sm sm:text-base text-gray-600">Celebrate your positive impact on the planet!</p>
              </div>
              
              {impactData?.achievements?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {impactData.achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No achievements yet</h4>
                  <p className="text-sm sm:text-base text-gray-600">Make your first eco-friendly purchase to unlock achievements!</p>
                </div>
              )}

              {/* Progress towards next achievements */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Next Achievements</h4>
                <div className="space-y-3 sm:space-y-4">
                  {impactData?.totalCarbonSaved < 5 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="text-lg sm:text-xl">💚</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Carbon Saver</p>
                        <p className="text-xs sm:text-sm text-gray-600">Save 5kg of CO₂ emissions</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2">
                          <div 
                            className="h-1.5 sm:h-2 bg-green-500 rounded-full"
                            style={{ width: `${Math.min((impactData?.totalCarbonSaved / 5) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{Math.round((impactData?.totalCarbonSaved / 5) * 100)}%</span>
                    </div>
                  )}
                  {impactData?.totalProducts < 10 && (
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                      <div className="text-lg sm:text-xl">🛍️</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Sustainable Shopper</p>
                        <p className="text-xs sm:text-sm text-gray-600">Purchase 10 sustainable products</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2">
                          <div 
                            className="h-1.5 sm:h-2 bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((impactData?.totalProducts / 10) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">{Math.round((impactData?.totalProducts / 10) * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center py-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Personalized Recommendations</h3>
                <p className="text-sm sm:text-base text-gray-600">Ways to increase your positive environmental impact</p>
              </div>

              {impactData?.recommendations?.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {impactData.recommendations.map((recommendation, index) => (
                    <RecommendationCard key={index} recommendation={recommendation} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Target className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">All caught up!</h4>
                  <p className="text-sm sm:text-base text-gray-600">You're doing great! Keep making sustainable choices.</p>
                </div>
              )}

              {/* Tips Section */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  Sustainability Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start gap-3">
                    <div className="text-lg sm:text-xl">🌱</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Choose Recycled Materials</p>
                      <p className="text-xs sm:text-sm text-gray-600">Products made from recycled materials have 60% lower carbon footprint</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-lg sm:text-xl">📦</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Minimal Packaging</p>
                      <p className="text-xs sm:text-sm text-gray-600">Look for products with biodegradable or minimal packaging</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-lg sm:text-xl">🚚</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Local Products</p>
                      <p className="text-xs sm:text-sm text-gray-600">Products from nearby reduce shipping emissions significantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-lg sm:text-xl">💡</div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Energy-Efficient Production</p>
                      <p className="text-xs sm:text-sm text-gray-600">Products made with renewable energy have 80% lower impact</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 