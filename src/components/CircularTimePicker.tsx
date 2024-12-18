import React, { useState } from 'react';

interface CircularTimePickerProps {
  onTimeSelect: (hours: number, minutes: number) => void;
}

export default function CircularTimePicker({ onTimeSelect }: CircularTimePickerProps) {
  const [showHours, setShowHours] = useState(true);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour);
    setShowHours(false);
  };

  const handleMinuteClick = (minute: number) => {
    setSelectedMinute(minute);
    if (selectedHour !== null) {
      onTimeSelect(selectedHour, minute);
    }
  };

  return (
    <div className="relative w-64 h-64">
      <div className="absolute inset-0 rounded-full border-2 border-gray-200">
        {showHours ? (
          // Hours clock
          hours.map((hour) => {
            const angle = (hour * 360) / 24;
            const radius = 110; // Slightly smaller than container
            const left = Math.sin((angle * Math.PI) / 180) * radius + 128;
            const top = -Math.cos((angle * Math.PI) / 180) * radius + 128;

            return (
              <button
                key={hour}
                onClick={() => handleHourClick(hour)}
                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center
                  ${selectedHour === hour ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'}`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                }}
              >
                {hour}
              </button>
            );
          })
        ) : (
          // Minutes clock
          minutes.map((minute) => {
            const angle = (minute * 360) / 60;
            const radius = 110;
            const left = Math.sin((angle * Math.PI) / 180) * radius + 128;
            const top = -Math.cos((angle * Math.PI) / 180) * radius + 128;

            return (
              <button
                key={minute}
                onClick={() => handleMinuteClick(minute)}
                className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center
                  ${selectedMinute === minute ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'}`}
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                }}
              >
                {minute}
              </button>
            );
          })
        )}
      </div>
      {/* Center text showing current selection */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-semibold">
          {selectedHour !== null 
            ? showHours 
              ? `${selectedHour}:00`
              : selectedMinute !== null 
                ? `${selectedHour}:${selectedMinute.toString().padStart(2, '0')}`
                : `${selectedHour}:00`
            : '--:--'}
        </span>
      </div>
    </div>
  );
} 