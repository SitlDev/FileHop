// Atomic masses of common elements
const atomicMasses = {
    'H': 1.008, 'C': 12.011, 'N': 14.007, 'O': 15.999, 'P': 30.974, 'S': 32.06,
    'Cl': 35.45, 'Na': 22.990, 'K': 39.098, 'Ca': 40.078, 'Fe': 55.845, 'Cu': 63.546,
    'Zn': 65.38, 'Br': 79.904, 'I': 126.90, 'F': 18.998, 'B': 10.811, 'Si': 28.086,
    'Mg': 24.305, 'Al': 26.982, 'N': 14.007, 'Ag': 107.87, 'Au': 196.97, 'Hg': 200.59
};

const equationInput = document.getElementById('equation-input');
const balanceBtn = document.getElementById('btn-balance-equation');
const copyBtn = document.getElementById('btn-copy-result');
const clearBtn = document.getElementById('btn-clear-equation');
const equationDisplay = document.getElementById('balanced-equation-display');
const balanceStatus = document.getElementById('balance-status');
const emailModal = document.getElementById('email-modal');
const emailForm = document.getElementById('email-signup-form');

let currentBalancedEquation = '';

balanceBtn.addEventListener('click', () => {
    const input = equationInput.value.trim();
    if (!input) {
        balanceStatus.textContent = 'Please enter an equation';
        return;
    }
    balanceEquation(input);
});

copyBtn.addEventListener('click', () => {
    if (currentBalancedEquation) {
        navigator.clipboard.writeText(currentBalancedEquation).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        });
    }
});

clearBtn.addEventListener('click', () => {
    equationInput.value = '';
    equationDisplay.textContent = 'Waiting for input...';
    balanceStatus.textContent = '';
    document.getElementById('reactants-table').querySelector('tbody').innerHTML = '';
    document.getElementById('products-table').querySelector('tbody').innerHTML = '';
    document.getElementById('molar-masses-container').innerHTML = '';
});

function parseFormula(formula) {
    const elements = {};
    let i = 0;
    
    while (i < formula.length) {
        // Capital letter starts an element
        if (/[A-Z]/.test(formula[i])) {
            let element = formula[i];
            i++;
            
            // Check for lowercase letter
            while (i < formula.length && /[a-z]/.test(formula[i])) {
                element += formula[i];
                i++;
            }
            
            // Check for number following element
            let count = '';
            while (i < formula.length && /[0-9]/.test(formula[i])) {
                count += formula[i];
                i++;
            }
            
            const num = count ? parseInt(count) : 1;
            elements[element] = (elements[element] || 0) + num;
            
        } else if (formula[i] === '(') {
            // Handle parentheses
            let depth = 1;
            let j = i + 1;
            while (j < formula.length && depth > 0) {
                if (formula[j] === '(') depth++;
                else if (formula[j] === ')') depth--;
                j++;
            }
            
            const subFormula = formula.substring(i + 1, j - 1);
            let multiplier = '';
            while (j < formula.length && /[0-9]/.test(formula[j])) {
                multiplier += formula[j];
                j++;
            }
            
            const mult = multiplier ? parseInt(multiplier) : 1;
            const subElements = parseFormula(subFormula);
            
            for (const [elem, count] of Object.entries(subElements)) {
                elements[elem] = (elements[elem] || 0) + count * mult;
            }
            
            i = j;
        } else {
            i++;
        }
    }
    
    return elements;
}

function calculateMolarMass(elements) {
    let mass = 0;
    for (const [element, count] of Object.entries(elements)) {
        if (atomicMasses[element]) {
            mass += atomicMasses[element] * count;
        }
    }
    return mass.toFixed(2);
}

function parseEquation(equation) {
    const parts = equation.split('=').map(p => p.trim());
    if (parts.length !== 2) return null;
    
    const reactants = parts[0].split('+').map(p => p.trim());
    const products = parts[1].split('+').map(p => p.trim());
    
    return { reactants, products };
}

function balanceEquation(input) {
    const equation = parseEquation(input);
    if (!equation) {
        balanceStatus.textContent = 'Invalid format. Use: A + B = C + D';
        return;
    }
    
    const allCompounds = [...equation.reactants, ...equation.products];
    const parsedCompounds = allCompounds.map(c => parseFormula(c));
    
    // For simplicity, try common coefficient combinations
    let balanced = tryBalance(parsedCompounds, equation.reactants.length);
    
    if (balanced) {
        const coefficients = balanced;
        const reactantCoeffs = coefficients.slice(0, equation.reactants.length);
        const productCoeffs = coefficients.slice(equation.reactants.length);
        
        // Format output
        const reactantStr = equation.reactants
            .map((r, i) => `${reactantCoeffs[i] > 1 ? reactantCoeffs[i] : ''}${r}`)
            .join(' + ');
        
        const productStr = equation.products
            .map((p, i) => `${productCoeffs[i] > 1 ? productCoeffs[i] : ''}${p}`)
            .join(' + ');
        
        currentBalancedEquation = `${reactantStr} = ${productStr}`;
        equationDisplay.textContent = currentBalancedEquation;
        equationDisplay.style.color = '#4caf50';
        balanceStatus.textContent = '✓ Equation balanced successfully!';
        balanceStatus.style.color = '#4caf50';
        
        // Display element analysis
        displayAnalysis(equation, coefficients);
        
        // Show analytics
        const eventDetails = {
            input: input,
            balanced: currentBalancedEquation,
            actionType: 'equation_balanced'
        };
        trackEvent('feature_use', 'chemical-equation-balancer', eventDetails);
        
    } else {
        balanceStatus.textContent = 'Could not balance this equation automatically. Please verify the formula.';
        balanceStatus.style.color = '#ff6b6b';
    }
}

function tryBalance(compounds, numReactants) {
    // Try coefficients 1-10 for each compound using a recursive approach
    const maxCoeff = 10;
    const n = compounds.length;
    
    // Use recursive approach for flexible number of compounds
    function tryCoefficients(index, currentCoeffs) {
        if (index === n) {
            // All coefficients assigned, check if balanced
            if (isBalanced(compounds, currentCoeffs, numReactants)) {
                return currentCoeffs.slice();
            }
            return null;
        }
        
        // Try coefficients from 1 to maxCoeff for current compound
        for (let coeff = 1; coeff <= maxCoeff; coeff++) {
            currentCoeffs[index] = coeff;
            const result = tryCoefficients(index + 1, currentCoeffs);
            if (result) return result;
        }
        
        return null;
    }
    
    return tryCoefficients(0, new Array(n));
}

function isBalanced(compounds, coefficients, numReactants) {
    const elementCounts = {};
    
    // Count elements on reactant side
    for (let i = 0; i < numReactants; i++) {
        for (const [elem, count] of Object.entries(compounds[i])) {
            elementCounts[elem] = (elementCounts[elem] || 0) + count * coefficients[i];
        }
    }
    
    // Subtract elements on product side
    for (let i = numReactants; i < compounds.length; i++) {
        for (const [elem, count] of Object.entries(compounds[i])) {
            elementCounts[elem] = (elementCounts[elem] || 0) - count * coefficients[i];
        }
    }
    
    // Check if all elements balance to zero
    return Object.values(elementCounts).every(count => count === 0);
}

function displayAnalysis(equation, coefficients) {
    const reactantCoeffs = coefficients.slice(0, equation.reactants.length);
    const productCoeffs = coefficients.slice(equation.reactants.length);
    
    // Display reactant analysis
    const reactantsBody = document.querySelector('#reactants-table tbody');
    reactantsBody.innerHTML = '';
    
    equation.reactants.forEach((compound, idx) => {
        const parsed = parseFormula(compound);
        for (const [elem, count] of Object.entries(parsed)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${elem}</td>
                <td>${atomicMasses[elem] || 'N/A'}</td>
                <td>${count * reactantCoeffs[idx]}</td>
                <td class="oxidation-state">--</td>
            `;
            reactantsBody.appendChild(row);
        }
    });
    
    // Display product analysis
    const productsBody = document.querySelector('#products-table tbody');
    productsBody.innerHTML = '';
    
    equation.products.forEach((compound, idx) => {
        const parsed = parseFormula(compound);
        for (const [elem, count] of Object.entries(parsed)) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${elem}</td>
                <td>${atomicMasses[elem] || 'N/A'}</td>
                <td>${count * productCoeffs[idx]}</td>
                <td class="oxidation-state">--</td>
            `;
            productsBody.appendChild(row);
        }
    });
    
    // Calculate and display molar masses
    const molarContainer = document.getElementById('molar-masses-container');
    molarContainer.innerHTML = '';
    
    equation.reactants.forEach((compound, idx) => {
        const parsed = parseFormula(compound);
        const mass = calculateMolarMass(parsed);
        const div = document.createElement('div');
        div.className = 'molar-mass';
        div.innerHTML = `
            <h4>${reactantCoeffs[idx]}× ${compound}</h4>
            <p>Molar mass: ${mass} g/mol</p>
            <p>Total mass: ${(mass * reactantCoeffs[idx]).toFixed(2)} g</p>
        `;
        molarContainer.appendChild(div);
    });
    
    const arrow = document.createElement('div');
    arrow.style.textAlign = 'center';
    arrow.style.margin = '15px 0';
    arrow.style.color = '#667eea';
    arrow.textContent = '↓';
    molarContainer.appendChild(arrow);
    
    equation.products.forEach((compound, idx) => {
        const parsed = parseFormula(compound);
        const mass = calculateMolarMass(parsed);
        const div = document.createElement('div');
        div.className = 'molar-mass';
        div.style.borderLeftColor = '#ffc107';
        div.innerHTML = `
            <h4 style="color: #ffc107;">${productCoeffs[idx]}× ${compound}</h4>
            <p>Molar mass: ${mass} g/mol</p>
            <p>Total mass: ${(mass * productCoeffs[idx]).toFixed(2)} g</p>
        `;
        molarContainer.appendChild(div);
    });
}

function trackEvent(eventType, tag, details = {}) {
    fetch('https://knotstranded.com/api/analytics.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventType,
            tag: tag,
            details: details,
            url: window.location.href
        })
    }).catch(() => {});
}

// Email modal
emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    
    fetch('https://knotstranded.com/api/newsletter.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            source: 'chemical-equation-balancer',
            tag: 'chemical-equation-balancer'
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Successfully subscribed!');
        emailModal.style.display = 'none';
        localStorage.setItem('email_modal_closed_chem', 'true');
    })
    .catch(() => alert('Subscription failed. Please try again.'));
});

// Show modal on page load (if not previously closed)
window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('email_modal_closed_chem')) {
        setTimeout(() => {
            emailModal.style.display = 'block';
        }, 3000);
    }
    
    document.querySelector('.close-modal').addEventListener('click', () => {
        emailModal.style.display = 'none';
        localStorage.setItem('email_modal_closed_chem', 'true');
    });
});
