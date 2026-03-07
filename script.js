document.addEventListener('DOMContentLoaded', () => {
    const itemTableBody = document.getElementById('itemTableBody');
    const addRowBtn = document.getElementById('addRowBtn');
    const addRowFooterBtn = document.getElementById('addRowFooterBtn');
    const customerSearch = document.getElementById('customerSearch');
    const billingDetails = document.getElementById('billingDetails');
    const shippingDetails = document.getElementById('shippingDetails');
    const formMainType = document.getElementById('formMainType');
    const addCustomerBtn = document.getElementById('addCustomerBtn');
    const customerModal = document.getElementById('customerModal');
    const serialModal = document.getElementById('serialModal');
    const closeBtns = document.querySelectorAll('.close');
    const sidebarItems = document.querySelectorAll('.sidebar-nav li[data-page]');
    const roundOffSwitch = document.getElementById('roundOff');

    // Special Buttons
    const fullScreenBtn = document.getElementById('fullScreenBtn');
    const changeShipBtn = document.getElementById('changeShipBtn');
    const cancelCustBtn = document.getElementById('cancelCustBtn');
    const saveCustBtn = document.getElementById('saveCustBtn');
    const saveSerialsBtn = document.getElementById('saveSerialsBtn');
    const saveTopBtn = document.getElementById('saveTopBtn');

    let rowCount = 0;
    const itemsList = ["CCTV Camera", "HIKVISION DVR", "AMC Service - 1 Year", "Hard Drive 1TB", "Power Supply 12V"];
    const customerData = [
        { name: "John Doe", company: "Doe Enterprises", address: "123 Street, Mumbai, MH", contact: "9876543210", gst: "27AAAAA0000A1Z5", area: "Andheri East" },
        { name: "Jane Smith", company: "Smith Solutions", address: "456 Avenue, Delhi, DL", contact: "8765432109", gst: "07BBBBB1111B2Z6", area: "Connaught Place" }
    ];

    // --- Row Addition ---
    function createTableRow() {
        rowCount++;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${rowCount}</td>
            <td style="position:relative">
                <input type="text" class="item-search-input" placeholder="Select Option">
            </td>
            <td><input type="number" class="qty-input" value="1"></td>
            <td>
                <select class="rate-type-select">
                    <option value="WO_TAX">W.O. TAX</option>
                    <option value="W_TAX">W. TAX</option>
                </select>
            </td>
            <td><input type="number" class="gst-pct-input" value="18"></td>
            <td><input type="number" class="rate-input" value="0"></td>
            <td>
                <select class="disc-type-select">
                    <option value="FIXED">FIXED(₹)</option>
                    <option value="PERCENT">PERCENT(%)</option>
                </select>
            </td>
            <td><input type="number" class="disc-val-input" value="0"></td>
            <td class="row-total-cell">0.00</td>
            <td><input type="number" value="0"></td>
            <td><button class="btn-sr-no">SR. NO.</button></td>
            <td><button class="remove-row-btn btn-icon-sm">🗑</button></td>
        `;
        itemTableBody.appendChild(tr);
        attachRowEvents(tr);
        calculateFinalTotals();
    }

    function attachRowEvents(tr) {
        tr.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => {
                updateRowCalculation(tr);
                calculateFinalTotals();
            });
        });

        tr.querySelector('.item-search-input').addEventListener('focus', function () {
            showDropdownMenu(this, itemsList.map(i => ({ name: i })));
        });

        tr.querySelector('.btn-sr-no').addEventListener('click', () => {
            const qty = tr.querySelector('.qty-input').value;
            openSerialEntryModal(qty);
        });

        tr.querySelector('.remove-row-btn').addEventListener('click', () => {
            tr.remove();
            reindexRows();
            calculateFinalTotals();
        });
    }

    function updateRowCalculation(tr) {
        const qty = parseFloat(tr.querySelector('.qty-input').value) || 0;
        const rate = parseFloat(tr.querySelector('.rate-input').value) || 0;
        const gstPct = parseFloat(tr.querySelector('.gst-pct-input').value) || 0;
        const discType = tr.querySelector('.disc-type-select').value;
        const discVal = parseFloat(tr.querySelector('.disc-val-input').value) || 0;

        let subtotal = qty * rate;
        let discountAmt = (discType === 'PERCENT') ? (subtotal * discVal / 100) : discVal;
        let taxableAmt = subtotal - discountAmt;
        let taxAmt = (taxableAmt * gstPct / 100);
        let total = taxableAmt + taxAmt;

        tr.querySelector('.row-total-cell').textContent = total.toFixed(2);
        tr.dataset.taxable = taxableAmt;
        tr.dataset.tax = taxAmt;
        tr.dataset.discount = discountAmt;
    }

    function reindexRows() {
        rowCount = 0;
        itemTableBody.querySelectorAll('tr').forEach((tr, i) => {
            rowCount++;
            tr.cells[0].textContent = rowCount;
        });
    }

    // --- Search & Dropdowns ---
    function showDropdownMenu(input, list) {
        let menu = document.querySelector('.floating-dropdown');
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'floating-dropdown card shadow';
            document.body.appendChild(menu);
        }
        menu.innerHTML = '';
        const rect = input.getBoundingClientRect();
        menu.style.cssText = `
            position: absolute;
            left: ${rect.left}px;
            top: ${rect.bottom + window.scrollY}px;
            width: ${rect.width}px;
            z-index: 3000;
            background: white;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
        `;

        list.forEach(item => {
            const div = document.createElement('div');
            div.textContent = item.name;
            div.style.cssText = `padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;`;
            div.onmousedown = () => {
                input.value = item.name;
                if (input.id === 'customerSearch') populateCustomerInfo(item);
                menu.style.display = 'none';
            };
            menu.appendChild(div);
        });
        menu.style.display = 'block';

        input.onblur = () => { setTimeout(() => { menu.style.display = 'none'; }, 200); };
    }

    function populateCustomerInfo(cust) {
        billingDetails.innerHTML = `
            <p><span class="label-tiny">Address:</span> <span class="val">${cust.address}</span></p>
            <p><span class="label-tiny">Contact No.:</span> <span class="val">${cust.contact}</span></p>
            <p><span class="label-tiny">GST No.:</span> <span class="val">${cust.gst}</span></p>
        `;
        shippingDetails.innerHTML = `
            <p><span class="label-tiny">Address:</span> <span class="val">${cust.address}</span></p>
            <p><span class="label-tiny">Area:</span> <span class="val">${cust.area}</span></p>
            <p><span class="label-tiny">Contact No.:</span> <span class="val">${cust.contact}</span></p>
        `;
    }

    customerSearch.addEventListener('focus', function () {
        showDropdownMenu(this, customerData);
    });

    // --- Totals Calculation ---
    function calculateFinalTotals() {
        let totalTaxable = 0, totalTax = 0, totalDisc = 0;
        itemTableBody.querySelectorAll('tr').forEach(tr => {
            totalTaxable += parseFloat(tr.dataset.taxable) || 0;
            totalTax += parseFloat(tr.dataset.tax) || 0;
            totalDisc += parseFloat(tr.dataset.discount) || 0;
        });

        const addCharge = parseFloat(document.getElementById('addCharge').value) || 0;
        const lessCharge = parseFloat(document.getElementById('lessCharge').value) || 0;
        let finalAmt = totalTaxable + totalTax + addCharge - lessCharge;

        if (roundOffSwitch.checked) {
            const rounded = Math.round(finalAmt);
            document.getElementById('roundOffValue').textContent = (rounded - finalAmt).toFixed(2);
            finalAmt = rounded;
        } else {
            document.getElementById('roundOffValue').textContent = "0.00";
        }

        document.getElementById('preTaxAmount').textContent = totalTaxable.toFixed(2);
        document.getElementById('totalDiscount').textContent = totalDisc.toFixed(2);
        document.getElementById('sgstAmount').textContent = (totalTax / 2).toFixed(2);
        document.getElementById('cgstAmount').textContent = (totalTax / 2).toFixed(2);
        document.getElementById('grandTotal').textContent = finalAmt.toFixed(2);
    }

    [addRowBtn, addRowFooterBtn].forEach(btn => btn.onclick = createTableRow);
    roundOffSwitch.onchange = calculateFinalTotals;
    document.getElementById('addCharge').oninput = calculateFinalTotals;
    document.getElementById('lessCharge').oninput = calculateFinalTotals;

    // --- Sidebar & Navigation ---
    sidebarItems.forEach(li => {
        li.onclick = (e) => {
            sidebarItems.forEach(i => i.classList.remove('active'));
            li.classList.add('active');

            if (li.classList.contains('has-submenu')) {
                const submenu = li.querySelector('.submenu');
                const chevron = li.querySelector('.chevron');
                submenu.style.display = (submenu.style.display === 'block') ? 'none' : 'block';
                chevron.classList.toggle('down');
            }
        };
    });

    // --- Special Interactions ---
    fullScreenBtn.onclick = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    changeShipBtn.onclick = () => {
        alert("Shipping address change initiated. Please select from available addresses.");
    };

    saveTopBtn.onclick = () => {
        alert("Invoice Saved Successfully!");
    };

    // --- Modal Interactions ---
    addCustomerBtn.onclick = () => customerModal.style.display = 'block';

    [cancelCustBtn, ...closeBtns].forEach(btn => btn.onclick = () => {
        customerModal.style.display = 'none';
        serialModal.style.display = 'none';
    });

    saveCustBtn.onclick = () => {
        alert("Customer Added Successfully!");
        customerModal.style.display = 'none';
    };

    saveSerialsBtn.onclick = () => {
        alert("Serial Numbers Saved!");
        serialModal.style.display = 'none';
    };

    function openSerialEntryModal(qty) {
        const container = document.getElementById('serialInputsContainer');
        container.innerHTML = '';
        for (let i = 1; i <= (parseInt(qty) || 1); i++) {
            const div = document.createElement('div');
            div.className = 'field-item mt-10';
            div.innerHTML = `<label>Serial No. ${i}</label><input type="text" class="input-styled" placeholder="Enter Serial Number">`;
            container.appendChild(div);
        }
        serialModal.style.display = 'block';
    }

    window.onclick = (e) => {
        if (e.target == customerModal || e.target == serialModal) {
            customerModal.style.display = 'none';
            serialModal.style.display = 'none';
        }
    };

    // Init
    createTableRow();
});
