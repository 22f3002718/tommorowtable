import React from 'react';

const StatsCard = ({ icon: Icon, label, value, trend, color = 'orange' }) => {
  const colorClasses = {
    orange: 'from-green-400 to-emerald-600',
    green: 'from-green-400 to-emerald-500',
    blue: 'from-blue-400 to-indigo-500',
    purple: 'from-purple-400 to-pink-500'
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-2 font-medium">
              {trend}
            </p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
