/*-------------------------- 
  Constants
  --------------------------*/
const Form = document.getElementById("lootForm");

// Global loot array that persists across the entire application
// Each loot item is stored an object with: { lootName, lootValue, lootRarity, lootFinalValue }
const Loot = [];

// Rarity multipliers that modify final value
const RarityMultiplier = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0
};

const GuildTaxThreshold = 1000;
const GuildTaxRate = 0.10;

/*-------------------------- 
  Script
  --------------------------*/
// Format a number as currency with two decimal places
function money(n) {
    return '$' + Math.abs(n).toFixed(2);
}

// Calculate total loot using a loop
// If updateUI is true, update the running total display in the Loot List panel
function getTotalLoot(updateUI = false) {
    let totalLoot = 0;
    let totalAfterTax = 0;
    let guildTax = 0;

    // Loop through all loot items and accumlate their final values
    for (let i = 0; i < Loot.length; i++) {
        totalLoot += Loot[i].lootFinalValue;
    }

    // Apply guild tax only if total exceeds the threshold
    if (totalLoot > GuildTaxThreshold) {
        guildTax = totalLoot * GuildTaxRate;
    }

    // Final total after tax deduction
    totalAfterTax = totalLoot - guildTax;

    // Update the running total in the UI if requested
    if (updateUI) {
        let html = `<p><strong>Total Loot:</strong> ${money(totalLoot)}</p>`;

        // Show tax breakdown only when applicable
        if (guildTax > 0) {
            html += `
                <p><strong>Guild Tax Applied:</strong> ${money(guildTax)}</p>
                <p><strong>Remaining Total:</strong> ${money(totalAfterTax)}</p>
            `;
        }

        document.getElementById('totalLoot').innerHTML = html;
    }
 
    return totalAfterTax;
}

// Render the loot list dynamically using a loop
function renderLoot() {
    let html = '';

    // If loot exists, build a <ul> list dynamically
    if (Loot.length > 0) {
        html = "<ul>"

        for (let i = 0; i < Loot.length; i++) {
            // Capitalize rarity for display purposes
            const Rarity = Loot[i].lootRarity.charAt(0).toUpperCase() + Loot[i].lootRarity.slice(1);

            html += `
                <li class="collapse-up rarity-${Loot[i].lootRarity}">
                    <span class="loot-text">
                        ${Loot[i].lootName} (${Rarity}) &mdash; ${money(Loot[i].lootValue)} &rarr; 
                        ${money(Loot[i].lootFinalValue)}
                    </span>
                    <button class="remove-btn" data-index="${i}">Remove</button>
                </li>
            `;
        }

        html += `</ul>`;

        // Update the running total after rendering
        getTotalLoot(true);
    } else {
        // If no loot exists, show a friendly message
        html = '<p>No loot exists.</p>'
    }

    document.getElementById("lootList").innerHTML = html;
}

// Add a new loot with full validation
function addLoot() {
    let error = '';

    // Read all form fields at once using FormData
    const Data = new FormData(Form);
    const Name = Data.get('lootName').trim();
    const Value = Number(Data.get('lootValue'));
    const Rarity = Data.get('lootRarity');

    // Validation for required fields
    if (Name === '') {
        error = '<p>Loot name cannot be empty.</p>';
    } else if (isNaN(Value)) {
        error = '<p>Loot value must be a number.</p>';
    } else if (Value <= 0) {
        error = '<p>Loot value must be a positive number greater than zero.</p>'
    }

    if (error === '') {
        // Push a new loot object into the global array
        Loot.push({
            lootName: Name, 
            lootValue: Value, 
            lootRarity: Rarity, 
            lootFinalValue: Value * RarityMultiplier[Rarity]
        });

        // Re-render the list and update totals
        renderLoot();

        // Automatically recalculate split when loot changes
        splitLoot();

        // Reset form fiedls
        Form.reset();
    }

    document.getElementById('lootError').innerHTML = error;
}

// Split the loot evenly among party members with validation
function splitLoot() {
    let html = `
        <p><strong>Total Loot:</strong></p>
        <p><strong>Loot Per Party Member:</strong></p>
    `;
    let error = '';

    const PartySize = Number(document.getElementById("partySize").value);

    // Validate party size and ensure loot exists before splitting
    if (PartySize < 1 || isNaN(PartySize)) {
        error = "<p>Party size must be at least 1.</p>"
    } else if (Loot.length === 0) {
        error = "<p>No loot to split.</p>";
    } 
    
    if (error === '') {
        const Total = getTotalLoot(false);
 
        html = `
            <p><strong>Total Loot:</strong> ${money(Total)}</p>
            <p><strong>Loot Per Party Member:</strong> ${money(Total/PartySize)}</p>
        `;
    }
    
    document.getElementById('partyError').innerHTML = error;
    document.getElementById("result").innerHTML = html;
}

// Initialize page behavior when the window loads
window.onload = function () {
    // Render initial empty loot list
    renderLoot();

    // Add Loot button: prevent page reload and call addLoot()
    Form.addEventListener("submit", function(e) {
        e.preventDefault();
        addLoot();
    });

    // Split Loot button
    document.getElementById('splitBtn').addEventListener('click', splitLoot);
    
    // Event delegation for remove buttons inside the loot list
    // This avoids attaching individual listeners to each button
    document.getElementById('lootList').addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-btn')) {
            const Index = Number(e.target.dataset.index);
            const Li = e.target.closest('li');

            // Trigger slide-up collapse animation
            Li.classList.add('collapsing');

            // Wait for animation to finish
            Li.addEventListener('transitionend', () => {
                Loot.splice(Index, 1);
                renderLoot();
                splitLoot(); // keep split results updated
            }, { once: true });
        }
    })
};