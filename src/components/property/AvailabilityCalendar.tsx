'use client';

import React, { useState } from 'react';
import { Property } from '@/types/property';

interface AvailabilityCalendarProps {
  property: Property;
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  showBookedDates?: boolean;
}

export default function AvailabilityCalendar({ 
  property, 
  onDateSelect, 
  selectedDate,
  showBookedDates = false 
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateAvailable = (date: Date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if day of week is available
    if (!property.availability.availableDays.includes(dayName)) {
      return false;
    }

    // Check if date is within availability range
    if (property.availability.startDate && date < property.availability.startDate) {
      return false;
    }

    if (property.availability.endDate && date > property.availability.endDate) {
      return false;
    }

    // Check if property has available capacity
    if (property.availability.currentOccupancy >= property.availability.maxOccupancy) {
      return false;
    }

    return true;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const available = isDateAvailable(date);
      const selected = isDateSelected(date);
      const today = isToday(date);
      const past = isPastDate(date);

      let dayClasses = 'h-10 w-10 flex items-center justify-center text-sm rounded-full cursor-pointer transition-colors ';
      
      if (past) {
        dayClasses += 'text-gray-300 cursor-not-allowed ';
      } else if (selected) {
        dayClasses += 'bg-blue-600 text-white ';
      } else if (today) {
        dayClasses += 'bg-blue-100 text-blue-600 font-semibold ';
      } else if (available) {
        dayClasses += 'text-gray-900 hover:bg-blue-50 ';
      } else {
        dayClasses += 'text-gray-400 cursor-not-allowed ';
      }

      days.push(
        <div
          key={day}
          className={dayClasses}
          onClick={() => {
            if (!past && available && onDateSelect) {
              onDateSelect(date);
            }
          }}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
            <span className="text-gray-600">Selected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded-full mr-2"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 rounded-full mr-2"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span className="text-gray-600">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Availability Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="space-y-1">
          <p>
            <span className="font-medium">Occupancy:</span> {property.availability.currentOccupancy}/{property.availability.maxOccupancy}
          </p>
          {property.availability.availableDays.length < 7 && (
            <p>
              <span className="font-medium">Available days:</span> {
                property.availability.availableDays
                  .map(day => day.charAt(0).toUpperCase() + day.slice(1, 3))
                  .join(', ')
              }
            </p>
          )}
          {property.availability.endDate && (
            <p>
              <span className="font-medium">Available until:</span> {
                property.availability.endDate.toLocaleDateString()
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}