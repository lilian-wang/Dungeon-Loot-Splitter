/*-------------------------- 
  Application State
  --------------------------*/
// Global loot array that persists across the entire application
// Each loot item is stored an object with: { lootName, lootValue, lootRarity, lootFinalValue }
const Loot = [];

// Current party size
let partySize = 1;

/*-------------------------- 
  DOM references
  --------------------------*/
const DOM = {
    nameInput: document.getElementById('lootName'),
    valueInput: document.getElementById('lootValue'),
    quantityInput: document.getElementById('lootQuantity'),
    raritySelect: document.getElementById('lootRarity'),
    errorDiv: document.getElementById('lootError'),
    splitBtn: document.getElementById('splitBtn'),
    partyError: document.getElementById('partyError'),
    result: document.getElementById('result'),
    totalLootDiv: document.getElementById('totalLoot'),
    noLootMsg: document.getElementById('noLootMessage'),
    lootRows: document.getElementById('lootRows')
};

/*-------------------------- 
  Constants
  --------------------------*/
// Rarity multipliers that modify final value
const RarityMultiplier = Object.freeze({
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0
});

const GuildTaxThreshold = 1000;
const GuildTaxRate = 0.10;

/*-------------------------- 
  Helpers
  --------------------------*/
// Format a number as currency with two decimal places
function money(n) {
    return Math.abs(n).toFixed(2);
}

// Render the loot list dynamically using a loop
function renderLoot() {
    DOM.lootRows.innerHTML = '';

    // Empty loot case
    if (Loot.length === 0) {
        DOM.noLootMsg.classList.remove('hidden');
    } else {
        DOM.noLootMsg.classList.add('hidden');

        // Build a list dynamically
        // Create .loot-row and .loot-cell elements
        for (let i = 0; i < Loot.length; i++) {
            const { lootName, lootValue, lootQuantity, lootRarity} = Loot[i];
            const Row = document.createElement('div');
            const NameCell = document.createElement('div');
            const NameLine = document.createElement('div');
            const RarityLine = document.createElement('div');
            const ValueCell = document.createElement('div');
            const BaseLine = document.createElement('div');
            const FinalLine = document.createElement('div');
            const QuantityCell = document.createElement('div');
            const ActionCell = document.createElement('div');
            const RemoveBtn = document.createElement('button');

            // Capitalize rarity for display purposes
            const Rarity = lootRarity.charAt(0).toUpperCase() + lootRarity.slice(1);

            // Compute final value with rarity multiplier for display purposes
            const FinalValue = lootValue * (RarityMultiplier[lootRarity] ?? 1);

            Row.className = `loot-row rarity-${lootRarity}`;
            
            NameCell.className = `loot-cell loot-name-cell`;
            NameLine.className = `loot-name`;
            NameLine.innerText = lootName;
            RarityLine.className = 'loot-rarity';
            RarityLine.innerText = Rarity;
            
            ValueCell.className = 'loot-cell loot-value-cell';
            BaseLine.classList = 'loot-value-base';
            BaseLine.innerText = `Base: ${money(lootValue)}`;
            FinalLine.classList = 'loot-value-final';
            FinalLine.innerText = `Final: ${money(FinalValue)}`;
            
            QuantityCell.className = 'loot-cell loot-quantity-cell';
            QuantityCell.innerText = lootQuantity;
            
            ActionCell.className = 'loot-cell loot-remove-cell loot-actions';
            
            RemoveBtn.className = 'remove-btn';
            RemoveBtn.innerText = 'Remove';
            RemoveBtn.setAttribute('aria-label', `Remove ${lootName} from loot list`);
            RemoveBtn.addEventListener('click', function () {
                removeLoot(i);
            });

            // Stack name + rarity
            NameCell.appendChild(NameLine);
            NameCell.appendChild(RarityLine);

            // Stack base + value
            ValueCell.appendChild(BaseLine);
            ValueCell.appendChild(FinalLine);
            
            ActionCell.appendChild(RemoveBtn);

            // Append cells to row
            Row.appendChild(NameCell);
            Row.appendChild(ValueCell);
            Row.appendChild(QuantityCell);
            Row.appendChild(ActionCell);

            DOM.lootRows.appendChild(Row);
        }
    }
}

/*-------------------------- 
  Core Functions
  --------------------------*/
// Remove a loot
function removeLoot(i) {
    Loot.splice(i, 1);
    updateUI();
}

// Perform all rendering and all total calculation
function updateUI() {
    let totalLoot = 0;
    let totalAfterTax = 0;
    let guildTax = 0;
    let validState = true;
    let totalHtml = '';

    DOM.splitBtn.disabled = true;
    DOM.partyError.textContent = '';
    DOM.result.classList.add('hidden');
    DOM.totalLootDiv.classList.add('hidden');

    //-------------------------------
    // 1. Calculate totals
    //-------------------------------
    // Loop through all loot items and accumulate their final values
    for (let i = 0; i < Loot.length; i++) {
        totalLoot += Loot[i].lootValue * Loot[i].lootQuantity * (RarityMultiplier[Loot[i].lootRarity] ?? 1);
    }

    // Apply guild tax only if total exceeds the threshold
    if (totalLoot > GuildTaxThreshold) {
        guildTax = totalLoot * GuildTaxRate;
    }

    // Final total after tax deduction
    totalAfterTax = totalLoot - guildTax;

    //-------------------------------
    // 2. Render loot list
    //-------------------------------
    renderLoot();

    // Update the running total
    totalHtml = `Total Loot: $${money(totalLoot)}`;

    if (guildTax > 0) {
        totalHtml += `
            <br>Guild Tax Applied: $${money(guildTax)}
            <br>Remaining Total: $${money(totalAfterTax)}
        `;
    }

    //-------------------------------
    // 3. Calculate split
    //-------------------------------
    // Validate party size and ensure loot exists before splitting
    validState = partySize > 0 && Loot.length > 0;
    if (!validState) {
        DOM.partyError.textContent = Loot.length === 0 ? 'No loot to split.' : 'Party size must be at least 1.';
    }

    //-------------------------------
    // 4. Enable/disable Split button
    //-------------------------------
    DOM.splitBtn.disabled = !validState;

    //-------------------------------
    // 5. Show/hide results
    //-------------------------------
    if (Loot.length > 0) {
        // Show the running total
        DOM.totalLootDiv.innerHTML = totalHtml;
        DOM.totalLootDiv.classList.remove('hidden');
        
        // Show the split results
        if (validState) {
            const Html = `
                Total Loot: $${money(totalAfterTax)}<br>
                Loot Per Party Member: $${money(totalAfterTax/partySize)}<br>
            `;

            DOM.result.innerHTML = Html; 
            DOM.result.classList.remove('hidden');
        }
    }
}

// Add a new loot with full validation
function addLoot() {
    let error = '';

    // Read all form fields
    const Name = DOM.nameInput.value.trim();
    const Value = parseFloat(DOM.valueInput.value.trim());
    const Quantity = parseInt(DOM.quantityInput.value.trim(), 10);
    const Rarity = DOM.raritySelect.value;

    // Validation for required fields
    if (Name === '') {
        error = 'Loot name cannot be empty.';
    } else if (isNaN(Value) || Value <= 0) {
        error = 'Loot value must be a positive number greater than zero.'
    } else if (isNaN(Quantity) || Quantity < 1) {
        error = 'Loot quantity must be at least 1.';
    }

    if (error !== '') {
        DOM.errorDiv.textContent = error;
    } else {
        // Push a new loot object into the global array
        Loot.push({
            lootName: Name, 
            lootValue: Value, 
            lootQuantity: Quantity,
            lootRarity: Rarity
        });

        // Reset form fields
        DOM.nameInput.value = '';
        DOM.valueInput.value = '';
        DOM.quantityInput.value = 1;
        DOM.raritySelect.value = 'common';

        DOM.errorDiv.textContent = '';

        // Automatically re-render the list, update totals, and recalculate split when loot changes
        updateUI();
    }
}

/*-------------------------- 
  Initialize page behavior
  --------------------------*/
window.onload = function () {
    // Render initial empty loot list
    updateUI();

    document.getElementById('partySize').addEventListener('input', function (e) {
        partySize = Number(e.target.value);
        updateUI();
    });

    // Add Loot button: prevent page reload and call addLoot()
    document.getElementById("lootForm").addEventListener("submit", function(e) {
        e.preventDefault();
        addLoot();
    });

    // Deprecated: UI is automatically updated to state change
    // Split Loot button
    document.getElementById('splitBtn').addEventListener('click', updateUI);
};