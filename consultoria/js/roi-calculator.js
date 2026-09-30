document.addEventListener('DOMContentLoaded', () => {
  // Inputs
  const budgetInput = document.getElementById('calcBudget');
  const cpcInput = document.getElementById('calcCpc');
  const croInput = document.getElementById('calcCro');
  const ticketInput = document.getElementById('calcTicket');

  // Outputs
  const outClicks = document.getElementById('outClicks');
  const outConversions = document.getElementById('outConversions');
  const outCac = document.getElementById('outCac');
  const outRevenue = document.getElementById('outRevenue');
  const outRoas = document.getElementById('outRoas');
  const outRoi = document.getElementById('outRoi');

  // Slide Label updates
  const labelBudget = document.getElementById('labelBudget');
  const labelCpc = document.getElementById('labelCpc');
  const labelCro = document.getElementById('labelCro');
  const labelTicket = document.getElementById('labelTicket');

  if (!budgetInput || !cpcInput || !croInput || !ticketInput) return;

  function calculateROI() {
    const budget = parseFloat(budgetInput.value);
    const cpc = parseFloat(cpcInput.value);
    const cro = parseFloat(croInput.value) / 100; // Convert percentage to ratio
    const ticket = parseFloat(ticketInput.value);

    // 1. Update text labels above sliders
    if (labelBudget) labelBudget.textContent = formatCurrency(budget);
    if (labelCpc) labelCpc.textContent = `R$ ${cpc.toFixed(2)}`;
    if (labelCro) labelCro.textContent = `${(cro * 100).toFixed(1)}%`;
    if (labelTicket) labelTicket.textContent = formatCurrency(ticket);

    // 2. Calculations
    const clicks = cpc > 0 ? Math.floor(budget / cpc) : 0;
    const conversions = Math.round(clicks * cro);
    const cac = conversions > 0 ? (budget / conversions) : 0;
    const revenue = conversions * ticket;
    const roas = budget > 0 ? (revenue / budget) : 0;
    const netProfit = revenue - budget;
    const roi = budget > 0 ? ((netProfit / budget) * 100) : 0;

    // 3. Update Outputs in DOM
    if (outClicks) outClicks.textContent = clicks.toLocaleString('pt-BR');
    if (outConversions) outConversions.textContent = conversions.toLocaleString('pt-BR');
    if (outCac) outCac.textContent = formatCurrency(cac);
    if (outRevenue) outRevenue.textContent = formatCurrency(revenue);
    if (outRoas) outRoas.textContent = `${roas.toFixed(2)}x`;
    
    if (outRoi) {
      outRoi.textContent = `${roi.toFixed(0)}%`;
      // Dynamic colors based on positive/negative ROI
      if (roi > 0) {
        outRoi.style.color = 'var(--secondary)'; // Green
      } else if (roi < 0) {
        outRoi.style.color = '#ff4d4d'; // Red
      } else {
        outRoi.style.color = 'var(--text)';
      }
    }
  }

  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  // Bind Events
  const allInputs = [budgetInput, cpcInput, croInput, ticketInput];
  allInputs.forEach(input => {
    input.addEventListener('input', calculateROI);
  });

  // Run initial calculation
  calculateROI();
});
