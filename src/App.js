import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import { database } from './FirebaseConfig';
import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [milk, setMilk] = useState('');
  const [bread, setBread] = useState('');
  const [onlinePayment, setOnlinePayment] = useState('');
  const [cashPayment, setCashPayment] = useState('');
  const [material, setMaterial] = useState('');
  const [expenses, setExpenses] = useState([]);

  const [totalMilk, setTotalMilk] = useState(0);
  const [totalBread, setTotalBread] = useState(0);
  const [totalOnlinePayment, setTotalOnlinePayment] = useState(0);
  const [totalCashPayment, setTotalCashPayment] = useState(0);
  const [totalMaterial, setTotalMaterial] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const data = collection(database, "expenses");

  const isNumeric = (value) => /^\d+$/.test(value);

  const handleNumericInputChange = (e, setValue) => {
    const inputValue = e.target.value;

    if (isNumeric(inputValue) || inputValue === '') {
      setValue(inputValue);
    }
  };

  useEffect(() => {
    const getData = async () => {
      const dbData = await getDocs(data);
      setExpenses(dbData.docs.map(doc => ({...doc.data(), id:doc.id})));
    }
    getData();
  },[]);
  
  const saveData = async() => {
    if (
      !isNumeric(milk) ||
      !isNumeric(bread) ||
      !isNumeric(onlinePayment) ||
      !isNumeric(cashPayment) ||
      !isNumeric(material)
    ) {
      alert('Please enter only numeric values for the relevant fields.');
      return;
    }

    const existingExpense = expenses.find(expense => expense.date === selectedDate);
    if (existingExpense) {
      // There is existing data for the selected date
      const userResponse = window.confirm('Expense data already exists for this date. Do you want to update it?');
  
      if (!userResponse) {
        // User chose not to update, so exit the function
        return;
      }
  
      // User confirmed to update, so update the existing expense
      const total = parseFloat(onlinePayment) + parseFloat(cashPayment);
      const updatedExpenses = expenses.map(expense =>
        expense.date === selectedDate ? { ...expense, milk, bread, onlinePayment, cashPayment, material, total } : expense
      );

      const updateExpense = expenses.filter(expense =>
        expense.date === selectedDate
      );
      
      const updateData = doc(database,"expenses", updateExpense[0].id);
      await updateDoc(updateData,{milk, bread, onlinePayment, cashPayment, material, total});
      

      setExpenses(updatedExpenses);
    } else {
      // No existing data for the selected date, add a new expense
      const total = parseFloat(onlinePayment) + parseFloat(cashPayment);
      const newExpense = {
        date: selectedDate,
        milk,
        bread,
        onlinePayment,
        cashPayment,
        material,
        total,
      };
  
      await addDoc(data, newExpense);
      // Update the expenses array with the new expense
      setExpenses([newExpense, ...expenses]);
    }

    // Clear input fields
    setMilk('');
    setBread('');
    setOnlinePayment('');
    setCashPayment('');
    setMaterial('');
  };

  const calculateTotalMonth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // Months are zero-based

    const startOfMonth = new Date(currentDate.getFullYear(), currentMonth, 11);
    const endOfMonth = new Date(currentDate.getFullYear(), currentMonth + 1, 10);

    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    const totalMilk = monthlyExpenses.reduce((acc, expense) => acc + parseFloat(expense.milk), 0);
    const totalBread = monthlyExpenses.reduce((acc, expense) => acc + parseFloat(expense.bread), 0);
    const totalOnlinePayment = monthlyExpenses.reduce((acc, expense) => acc + parseFloat(expense.onlinePayment), 0);
    const totalCashPayment = monthlyExpenses.reduce((acc, expense) => acc + parseFloat(expense.cashPayment), 0);
    const totalMaterial = monthlyExpenses.reduce((acc, expense) => acc + parseFloat(expense.material), 0);
    const totalPayment = totalOnlinePayment + totalCashPayment;

    // Now you can use these total values in your component state or display them directly
    // For example, you can set them in state and display them in your component

    setTotalMilk(totalMilk.toFixed(2));
    setTotalBread(totalBread.toFixed(2));
    setTotalOnlinePayment(totalOnlinePayment.toFixed(2));
    setTotalCashPayment(totalCashPayment.toFixed(2));
    setTotalMaterial(totalMaterial.toFixed(2));
    setTotalPayment(totalPayment.toFixed(2));

    // Show the results
    setShowResults(true);

    // After 2 minutes, hide the results
    setTimeout(() => {
      setShowResults(false);
    }, 2 * 60 * 1000); // 2 minutes in milliseconds

  };

  
  return (
    <div className="app-container">
      <h1>Daily Expenses Tracker</h1>
      <div className="input-group">
        <label>Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label>Milk:</label>
        <input type="text" value={milk} onChange={(e) => handleNumericInputChange(e, setMilk)} />
      </div>
      <div className="input-group">
        <label>Bread:</label>
        <input type="text" value={bread} onChange={(e) => handleNumericInputChange(e, setBread)} />
      </div>
      <div className="input-group">
        <label>Online Payment:</label>
        <input
          type="text"
          value={onlinePayment}
          onChange={(e) => handleNumericInputChange(e, setOnlinePayment)}
        />
      </div>
      <div className="input-group">
        <label>Cash Payment:</label>
        <input
          type="text"
          value={cashPayment}
          onChange={(e) => handleNumericInputChange(e, setCashPayment)}
        />
      </div>
      <div className="input-group">
        <label>Material Payment:</label>
        <input
          type="text"
          value={material}
          onChange={(e) => handleNumericInputChange(e, setMaterial)}
        />
      </div>
      
      <button className="save-button" onClick={saveData}>
        Save
      </button>

      {/* Display saved expenses */}
      <div className="expenses-list">
        <h2>Saved Expenses</h2>
        <ul>
          {expenses.map((expense) => (
            <li key={expense.id}>
              <strong>Date:</strong> {expense.date},{' '} 
              <strong>Milk:</strong> {expense.milk},{' '}
              <strong>Bread:</strong> {expense.bread},{' '}
              <strong>Online Payment:</strong> {expense.onlinePayment},{' '}
              <strong>Cash Payment:</strong> {expense.cashPayment},{' '}
              <strong>Material:</strong> {expense.material},{' '}
              <strong>Total:</strong> {expense.total}
            </li>
          ))}
        </ul>
      </div>

      <button className="save-button" onClick={calculateTotalMonth}>
        calculate Month Expense
      </button>
      {showResults && (
        <div>
          <h2>Monthly expense</h2>
                <p><strong>Milk :</strong> {totalMilk}</p> 
                <p><strong>Bread :</strong> {totalBread} </p>
                <p><strong>Online Payment :</strong> {totalOnlinePayment} </p>
                <p><strong>Cash Payment :</strong> {totalCashPayment} </p>
                <p><strong>Material :</strong> {totalMaterial} </p>
                <p><strong>Total :</strong> {totalPayment} </p>
                <p><strong>Total Material : </strong>{parseFloat(totalMilk) + parseFloat(totalBread) + parseFloat(totalMaterial)} </p>
        </div>
      )}
    </div>
  );
}

export default App;
