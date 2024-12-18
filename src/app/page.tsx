'use client';
import { useState, KeyboardEvent, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  dueDate: Date | null;
  notificationScheduled?: boolean;
  category: string;
}

const styles = `
  .react-datepicker-wrapper,
  .react-datepicker__input-container {
    width: 100%;
  }
  
  .react-datepicker {
    font-size: 0.8rem;
    transform: scale(0.9);
    transform-origin: top center;
  }
  
  .react-datepicker__header {
    padding-top: 6px;
  }
  
  .react-datepicker__month {
    margin: 0.4em;
  }
  
  .react-datepicker__day-name, .react-datepicker__day {
    width: 1.5rem;
    line-height: 1.5rem;
    margin: 0.1rem;
  }

  /* Custom dropdown height */
  select {
    max-height: 200px;
  }

  select option {
    padding: 4px;
  }

  /* For Firefox */
  select {
    scrollbar-width: thin;
    scrollbar-color: #CBD5E0 #EDF2F7;
  }

  /* For Chrome/Edge */
  select::-webkit-scrollbar {
    width: 8px;
  }

  select::-webkit-scrollbar-track {
    background: #EDF2F7;
  }

  select::-webkit-scrollbar-thumb {
    background-color: #CBD5E0;
    border-radius: 4px;
  }
`;

type SortOption = 'date' | 'time' | 'status' | 'none';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [selectedAMPM, setSelectedAMPM] = useState<string>('');
  const [showTimeDropdowns, setShowTimeDropdowns] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('none');

  const categories = [
    'Work',
    'Personal',
    'Shopping',
    'Health',
    'Important',
    'Other'
  ];

  useEffect(() => {
    // Request notification permission when component mounts
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Check for due tasks every minute
    const interval = setInterval(checkDueTasks, 60000);
    return () => clearInterval(interval);
  }, [todos]);

  const checkDueTasks = () => {
    const now = new Date();
    todos.forEach(todo => {
      if (
        todo.dueDate && 
        !todo.completed && 
        !todo.notificationScheduled && 
        todo.dueDate.getTime() - now.getTime() <= 600000 && // 10 minutes in milliseconds
        todo.dueDate.getTime() > now.getTime()
      ) {
        scheduleNotification(todo);
      }
    });
  };

  const scheduleNotification = (todo: Todo) => {
    if (!todo.dueDate || !("Notification" in window)) return;

    const timeUntilDue = todo.dueDate.getTime() - new Date().getTime() - 600000; // 10 minutes before
    
    if (timeUntilDue <= 0) return;

    setTimeout(() => {
      if (Notification.permission === "granted" && !todo.completed) {
        new Notification("Task Due Soon!", {
          body: `"${todo.text}" is due in 10 minutes!`,
          icon: "/favicon.ico"
        });
      }
    }, timeUntilDue);

    // Mark notification as scheduled
    setTodos(todos.map(t => 
      t.id === todo.id 
        ? { ...t, notificationScheduled: true } 
        : t
    ));
  };

  const toggleTodo = (id: number) => {
    setTodos(prevTodos => 
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  const handleAddTodo = () => {
    if (inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
        dueDate: dueDate,
        notificationScheduled: false,
        category: selectedCategory || 'Other'
      };
      
      setTodos(prevTodos => [...prevTodos, newTodo]);
      
      // Reset form
      setInputValue('');
      setDueDate(null);
      setSelectedHour(null);
      setSelectedMinute(null);
      setSelectedAMPM('');
      setShowTimeDropdowns(false);
      setSelectedCategory('');
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDateSelect = (date: Date | null) => {
    setDueDate(date);
    if (date) {
      setShowTimeDropdowns(true);
    }
  };

  const handleTimeChange = (hour: number | null, minute: number | null, ampm: string) => {
    if (dueDate && hour !== null && minute !== null && ampm !== '') {
      const newDate = new Date(dueDate);
      const actualHour = ampm === 'am' ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
      newDate.setHours(actualHour, minute, 0);
      setDueDate(newDate);
      
      if (hour !== null && minute !== null && ampm !== '') {
        setShowTimeDropdowns(false);
        setSelectedHour(null);
        setSelectedMinute(null);
        setSelectedAMPM('');
      }
    }
  };

  // Sorting function
  const sortTodos = (todos: Todo[]) => {
    const sortedTodos = [...todos];
    
    switch (sortBy) {
      case 'date':
        return sortedTodos.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });
      case 'time':
        return sortedTodos.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getHours() * 60 + a.dueDate.getMinutes() -
                 (b.dueDate.getHours() * 60 + b.dueDate.getMinutes());
        });
      case 'status':
        return sortedTodos.sort((a, b) => {
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
        });
      default:
        return sortedTodos;
    }
  };

  // Group and sort todos
  const groupedTodos = sortTodos(todos).reduce((groups, todo) => {
    const category = todo.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(todo);
    return groups;
  }, {} as Record<string, Todo[]>);

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-8">
        <main className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden transition-shadow hover:shadow-2xl">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white">Todo List</h1>
              <button
                onClick={() => {
                  if ("Notification" in window) {
                    Notification.requestPermission();
                  }
                }}
                className="px-4 py-2 text-sm bg-white/20 text-white rounded-lg 
                  hover:bg-white/30 active:bg-white/40 transition-all duration-200
                  backdrop-blur-sm shadow-sm hover:shadow-md"
              >
                Enable Notifications
              </button>
            </div>
          </div>

          {/* Input Section */}
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl 
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                    transition-all duration-200 text-gray-700 placeholder-gray-400
                    shadow-sm hover:shadow-md bg-white"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="sm:w-36 px-4 py-3 text-sm border border-gray-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                    transition-all duration-200 text-gray-700 placeholder-gray-400
                    shadow-sm hover:shadow-md bg-white cursor-pointer
                    appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.25rem',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="" className="text-gray-400">Category</option>
                  {categories.map(category => (
                    <option 
                      key={category} 
                      value={category}
                      className="py-2 text-gray-700"
                    >
                      {category}
                    </option>
                  ))}
                </select>
                <div className="relative sm:w-36">
                  <DatePicker
                    selected={dueDate}
                    onChange={handleDateSelect}
                    dateFormat="MMM d, yyyy"
                    placeholderText="Due date"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                      transition-all duration-200 text-gray-700 placeholder-gray-400
                      shadow-sm hover:shadow-md text-sm cursor-pointer bg-white"
                  />
                  {dueDate && showTimeDropdowns && (
                    <div className="absolute right-0 z-50 mt-2 bg-white/95 backdrop-blur-sm rounded-xl 
                      shadow-lg border border-gray-100/50 p-4" 
                      style={{ 
                        width: '220px',
                        transform: 'translateX(-20%)'
                      }}>
                      <div className="text-center mb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Select Time
                      </div>
                      <div className="flex gap-2 justify-center bg-gray-50/50 p-2 rounded-lg">
                        {/* Hours dropdown */}
                        <select
                          value={selectedHour ?? ''}
                          onChange={(e) => {
                            const hour = e.target.value ? parseInt(e.target.value) : null;
                            setSelectedHour(hour);
                            if (hour !== null && selectedMinute !== null && selectedAMPM !== '') {
                              handleTimeChange(hour, selectedMinute, selectedAMPM);
                            }
                          }}
                          className="w-16 px-2 py-1.5 text-sm border-0 rounded-lg focus:outline-none 
                            focus:ring-2 focus:ring-blue-500/50 text-gray-700 cursor-pointer
                            appearance-none bg-white shadow-sm hover:bg-gray-50 
                            transition-all duration-200"
                          onClick={(e) => {
                            const select = e.currentTarget;
                            select.size = select.size === 1 ? 5 : 1;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.size = 1;
                          }}
                          size={1}
                        >
                          <option value="" className="text-gray-400">Hr</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                            <option key={hour} value={hour === 12 ? 0 : hour} 
                              className="py-1.5 px-2 hover:bg-blue-50">
                              {hour}
                            </option>
                          ))}
                        </select>

                        {/* Minutes dropdown */}
                        <select
                          value={selectedMinute ?? ''}
                          onChange={(e) => {
                            const minute = e.target.value ? parseInt(e.target.value) : null;
                            setSelectedMinute(minute);
                            if (selectedHour !== null && minute !== null && selectedAMPM !== '') {
                              handleTimeChange(selectedHour, minute, selectedAMPM);
                            }
                          }}
                          className="w-16 px-2 py-1.5 text-sm border-0 rounded-lg focus:outline-none 
                            focus:ring-2 focus:ring-blue-500/50 text-gray-700 cursor-pointer
                            appearance-none bg-white shadow-sm hover:bg-gray-50 
                            transition-all duration-200"
                          onClick={(e) => {
                            const select = e.currentTarget;
                            select.size = select.size === 1 ? 5 : 1;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.size = 1;
                          }}
                          size={1}
                        >
                          <option value="" className="text-gray-400">Min</option>
                          {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                            <option key={minute} value={minute} 
                              className="py-1.5 px-2 hover:bg-blue-50">
                              {minute.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>

                        {/* AM/PM dropdown */}
                        <select
                          value={selectedAMPM}
                          onChange={(e) => {
                            const ampm = e.target.value;
                            setSelectedAMPM(ampm);
                            if (selectedHour !== null && selectedMinute !== null && ampm !== '') {
                              handleTimeChange(selectedHour, selectedMinute, ampm);
                            }
                          }}
                          className="w-16 px-2 py-1.5 text-sm border-0 rounded-lg focus:outline-none 
                            focus:ring-2 focus:ring-blue-500/50 text-gray-700 cursor-pointer
                            appearance-none bg-white shadow-sm hover:bg-gray-50 
                            transition-all duration-200"
                          onClick={(e) => {
                            const select = e.currentTarget;
                            select.size = select.size === 1 ? 3 : 1;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.size = 1;
                          }}
                          size={1}
                        >
                          <option value="" className="text-gray-400">--</option>
                          <option value="am" className="py-1.5 px-2 hover:bg-blue-50">AM</option>
                          <option value="pm" className="py-1.5 px-2 hover:bg-blue-50">PM</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={handleAddTodo}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600
                  text-white rounded-xl font-medium shadow-md
                  hover:shadow-lg active:shadow-sm transform transition-all duration-200
                  hover:-translate-y-0.5 active:translate-y-0
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!inputValue.trim()}
              >
                Add Task
              </button>
            </div>

            {/* Sort Buttons */}
            <div className="px-6 pb-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm font-medium text-gray-500">Sort by:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSortBy(sortBy === 'date' ? 'none' : 'date')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${sortBy === 'date'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date
                    </div>
                  </button>

                  <button
                    onClick={() => setSortBy(sortBy === 'time' ? 'none' : 'time')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${sortBy === 'time'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Time
                    </div>
                  </button>

                  <button
                    onClick={() => setSortBy(sortBy === 'status' ? 'none' : 'status')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${sortBy === 'status'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status
                    </div>
                  </button>

                  {sortBy !== 'none' && (
                    <button
                      onClick={() => setSortBy('none')}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 
                        hover:bg-gray-200 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Grouped Task List */}
            <div className="mt-8 space-y-6">
              {Object.entries(groupedTodos).map(([category, categoryTodos]) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                      {categoryTodos.length} {categoryTodos.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  
                  <ul className="space-y-3">
                    {categoryTodos.map((todo) => (
                      <li 
                        key={todo.id} 
                        className="group flex items-center gap-4 p-4 bg-gray-50 rounded-xl
                          transition-all duration-200 hover:shadow-md hover:bg-gray-100/80"
                      >
                        <input 
                          type="checkbox" 
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id)}
                          className="w-5 h-5 rounded-md border-gray-300 text-blue-500 
                            focus:ring-blue-500/50 transition-all duration-200
                            hover:border-blue-500 cursor-pointer" 
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`block text-sm sm:text-base ${
                            todo.completed 
                              ? 'line-through text-gray-400' 
                              : 'text-gray-700'
                          }`}>
                            {todo.text}
                          </span>
                          {todo.dueDate && (
                            <span className="block text-xs sm:text-sm text-gray-400 mt-1">
                              Due: {formatDateTime(todo.dueDate)}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => deleteTodo(todo.id)}
                          className="p-2 text-gray-400 hover:text-red-500 
                            opacity-0 group-hover:opacity-100 transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              
              {todos.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No tasks yet. Add one above!</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

