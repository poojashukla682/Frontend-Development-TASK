const API_BASE = "https://fielddesk.in/app/api/";

$(document).ready(function () {
    // --- Elements (using jQuery) ---
    const $itemTableBody = $('#itemTableBody');
    const $addRowBtn = $('#addRowBtn');
    const $addRowFooterBtn = $('#addRowFooterBtn');
    const $companySearch = $('#companyNameSelectDD');
    const $billType = $('#billType');
    const $installationToggle = $('#installationToggle');
    const $roundOffToggle = $('#roundOffToggle');

    // Hidden Customer Fields
    const $selectedCustomerId = $('#selectedCustomerId');
    const $billingAddressHidden = $('#billingAddress');
    const $billingContactHidden = $('#billingContact');
    const $billingGstHidden = $('#billingGstNumber');
    const $billingAreaHidden = $('#billingArea');
    const $billingStateHidden = $('#billingState');
    const $shippingAddressHidden = $('#shippingAddress');
    const $shippingAreaHidden = $('#shippingArea');
    const $shippingContactHidden = $('#shippingContact');

    // UI Display Fields
    const $billingDetailsDisplay = $('#billingDetailsDisplay');
    const $shippingDetailsDisplay = $('#shippingDetailsDisplay');

    let rowCount = 0;
    let companyState = "";
    let customerState = "";

    // --- Page Initialization ---
    function initPage() {
        // Initialize Summernote
        $('#remark, #termsAndConditionsDesc').summernote({
            placeholder: 'Enter content...',
            tabsize: 2,
            height: 100,
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ]
        });

        $.get(`${API_BASE}getsalesinvno.php`, function (data) {
            if (data) {
                setInvoiceData(data);
            }
        }, 'json').fail(() => {
            console.warn("API Error: Fallback to Demo Invoice No.");
            setInvoiceData({ invoice_prefix: "INV-DEMO-", invno: "1001", company_state: "Maharashtra" });
        });

        loadTerms();
        createTableRow(); // Add initial row
    }

    function setInvoiceData(data) {
        $('#invoiceNumber').val((data.invoice_prefix || "") + (data.invno || ""));
        $('#transactionId').val(data.invno || "");
        $('#invoiceNumber').attr('data-state', data.company_state || "");
        companyState = data.company_state || "";
    }

    // --- API: Load Terms ---
    function loadTerms() {
        $.get(`${API_BASE}termsandconditionlist.php`, function (data) {
            if (data && data.terms) {
                renderTerms(data.terms);
            }
        }, 'json').fail(() => {
            console.warn("API Error: Demo Terms Fallback.");
            renderTerms([
                { name: "Standard Terms", description: "1. 50% Advance with order.\n2. Balance against delivery." },
                { name: "Warranty Service", description: "1. Free service for 12 months.\n2. Parts as per warranty card." }
            ]);
        });
    }

    function renderTerms(terms) {
        const $select = $('#termsAndConditionsDD');
        $select.empty().append('<option value="">Select Terms</option>');
        terms.forEach(t => {
            $select.append($('<option>', {
                value: t.name,
                text: t.name,
                'data-desc': t.description
            }));
        });
        $select.off('change').on('change', function () {
            const desc = $(this).find(':selected').data('desc');
            $('#termsAndConditionsDesc').val(desc || "");
        });
    }

    // --- API: Load AMC Type ---
    function loadAMCTypes() {
        $.get(`${API_BASE}amctype.php?amctype`, function (data) {
            if (data && data.amctype) {
                renderAMCTypes(data.amctype);
            }
        }, 'json').fail(() => {
            console.warn("API Error: Demo AMC Type Fallback.");
            renderAMCTypes([
                { id: 1, name: "Comprehensive AMC" },
                { id: 2, name: "Non-Comprehensive AMC" },
                { id: 3, name: "Labor Only" }
            ]);
        });
    }

    function renderAMCTypes(list) {
        const $select = $('#AMCType');
        $select.empty().append('<option value="">Select Option</option>');
        list.forEach(a => {
            $select.append($('<option>', { value: a.id, text: a.name }));
        });
    }

    // --- Row Management ---
    function createTableRow() {
        rowCount++;
        const index = rowCount;
        const $tr = $(`
            <tr data-index="${index}">
                <td>${index}</td>
                <td style="position:relative">
                    <input type="text" id="itemName_${index}" name="itemname[]" class="input-styled itemname-dropdown" placeholder="Select Option">
                    <input type="hidden" name="item_id[]" id="itemId_${index}">
                </td>
                <td><input type="number" id="itemQuantity_${index}" name="qty[]" value="1" class="input-styled qty-field" min="1"></td>
                <td>
                    <select id="itemRateTypeCheckbox_${index}" name="ratetype[]" class="input-styled rate-type-field">
                        <option value="W.O. TAX">W.O. TAX</option>
                        <option value="W. TAX">W. TAX</option>
                    </select>
                </td>
                <td><input type="number" id="itemGstPer_${index}" name="gst_per[]" value="0" class="input-styled gst-pct-field"></td>
                <td><input type="number" id="itemRate_${index}" name="rate[]" value="0" class="input-styled rate-field"></td>
                <td>
                    <select id="itemDiscTypeDD_${index}" name="disc_type[]" class="input-styled disc-type-field">
                        <option value="PERCENTAGE">PERCENTAGE(%)</option>
                        <option value="FIXED">FIXED(₹)</option>
                    </select>
                </td>
                <td>
                    <input type="number" id="itemDiscValue_${index}" name="disc_value[]" value="0" class="input-styled disc-val-field">
                    <input type="hidden" id="itemDiscAmount_${index}" name="disc_amt[]" value="0">
                </td>
                <td>
                    <span class="row-total-display">0.00</span>
                    <input type="hidden" id="itemTotalInput_${index}" name="amount[]" value="0">
                </td>
                <td><input type="number" id="itemWarranty_${index}" name="wr[]" value="0" class="input-styled"></td>
                <td><button type="button" class="btn-sr-no" id="srBtn_${index}">SR. NO.</button><input type="hidden" id="itemserialNumber_${index}" name="serialno[]"></td>
                <td><button type="button" class="remove-row-btn btn-icon-sm">🗑</button></td>
            </tr>
        `);
        $itemTableBody.append($tr);
        attachRowEvents($tr);
    }

    function attachRowEvents($tr) {
        const index = $tr.data('index');
        const $nameInput = $tr.find('.itemname-dropdown');

        $nameInput.on('input', debounce(() => searchItems($input, $tr), 300));

        // CRITICAL: Ensure every input change triggers a recalculation
        $tr.find('input, select').on('input change', function () {
            calculateRow($tr);
        });

        $tr.find('.remove-row-btn').on('click', function () {
            $tr.remove();
            calculateSummary();
        });

        $tr.find('.btn-sr-no').on('click', function () {
            const qty = $tr.find('.qty-field').val();
            openSerialModal(index, qty);
        });

        // Initial calculation for the new row
        calculateRow($tr);
    }

    // --- Search Logic ---
    function searchItems($input, $tr) {
        const term = $input.val();
        if (term.length < 2) return;
        $.getJSON(`${API_BASE}fetch_allitem.php?searchTerm=${term}`, function (items) {
            showSearchResults($input, items, $tr, true);
        }).fail(() => {
            console.warn("API Error: Demo Item Search Fallback.");
            const demoItems = [
                { id: 1, itemname: "Solar Inverter 5kW", gst: 18, sal_rate: 45000, warranty: 24 },
                { id: 2, itemname: "Battery 150Ah", gst: 28, sal_rate: 12000, warranty: 36 },
                { id: 3, itemname: "Copper Wire 2.5mm", gst: 18, sal_rate: 150, warranty: 12 }
            ];
            showSearchResults($input, demoItems.filter(i => i.itemname.toLowerCase().includes(term.toLowerCase())), $tr, true);
        });
    }

    function showSearchResults($input, items, $target, isItem) {
        showSearchMenu($input, items, obj => {
            if (isItem) {
                $input.val(obj.itemname);
                $target.find('input[name="item_id[]"]').val(obj.id);
                $target.find('.gst-pct-field').val(obj.gst || 0);
                $target.find('.rate-field').val(obj.sal_rate || 0);
                $target.find('input[name="wr[]"]').val(obj.warranty || 0);
                calculateRow($target);
            } else {
                $input.val(obj.name);
                $('#selectedCustomerId').val(obj.id);
                fetchCustomerDetails(obj.id, obj); // Pass obj as fallback
            }
        }, isItem ? (i => i.itemname) : (c => `${c.name} - ${c.contact}`));
    }

    function fetchItemDetails(id, $tr) {
        $.getJSON(`${API_BASE}itemmaster.php?getitemid=${id}`, function (resp) {
            if (resp && resp.data && resp.data[0]) {
                const item = resp.data[0];
                $tr.find('.gst-pct-field').val(item.gst || 0);
                $tr.find('.rate-field').val(item.sal_rate || 0);
                $tr.find('input[name="wr[]"]').val(item.warranty || 0);
                calculateRow($tr);
            }
        });
    }

    $companySearch.on('input', debounce(function () {
        const term = $(this).val();
        if (term.length < 2) return;
        $.getJSON(`${API_BASE}fetch_customers.php?searchTerm=${term}`, function (customers) {
            showSearchResults($companySearch, customers, null, false);
        }).fail(() => {
            console.warn("API Error: Demo Customer Search Fallback.");
            const demoCusts = [
                { id: 101, name: "Pooja Gupta", contact: "9876543210", address: "Sector 15, Vashi, Mumbai", gst: "27AAAAA0000A1Z5", area: "Navi Mumbai", state: "Maharashtra" },
                { id: 102, name: "Tarun Soni", contact: "8888888888", address: "DLF Phase 3, Gurgaon", gst: "06BBBBB1111B1Z2", area: "Gurgaon", state: "Haryana" },
                { id: 103, name: "Octapro Pvt Ltd", contact: "7777777777", address: "Salt Lake City, Kolkata", gst: "19CCCCC2222C1Z9", area: "Kolkata", state: "West Bengal" }
            ];
            showSearchResults($companySearch, demoCusts.filter(c => c.name.toLowerCase().includes(term.toLowerCase())), null, false);
        });
    }, 300));

    function fetchCustomerDetails(id, fallbackObj = null) {
        $.getJSON(`${API_BASE}customer.php?getcustomerid=${id}`, function (resp) {
            if (resp && resp.data && resp.data[0]) {
                fillCustomerData(resp.data[0]);
            }
        }).fail(() => {
            if (fallbackObj) fillCustomerData(fallbackObj);
        });
    }

    function fillCustomerData(c) {
        $billingAddressHidden.val(c.address);
        $billingContactHidden.val(c.contact);
        $billingGstHidden.val(c.gst);
        $billingAreaHidden.val(c.area);
        $billingStateHidden.val(c.state);
        customerState = c.state;

        $shippingAddressHidden.val(c.address);
        $shippingAreaHidden.val(c.area);
        $shippingContactHidden.val(c.contact);

        updateCustomerDisplay(c);
        updateTaxLayout();
        calculateSummary();
    }

    function updateCustomerDisplay(c) {
        $billingDetailsDisplay.html(`
            <p><span class="label-tiny">Address:</span> <span class="val">${c.address || "-"}</span></p>
            <p><span class="label-tiny">Contact No.:</span> <span class="val">${c.contact || "-"}</span></p>
            <p><span class="label-tiny">GST No.:</span> <span class="val">${c.gst || "-"}</span></p>
        `);
        $shippingDetailsDisplay.html(`
            <p><span class="label-tiny">Address:</span> <span class="val">${c.address || "-"}</span></p>
            <p><span class="label-tiny">Area:</span> <span class="val">${c.area || "-"}</span></p>
            <p><span class="label-tiny">Contact No.:</span> <span class="val">${c.contact || "-"}</span></p>
        `);
    }

    function updateTaxLayout() {
        const isInterState = companyState && customerState && companyState.toLowerCase() !== customerState.toLowerCase();
        $('.sgst-row, .cgst-row').toggle(!isInterState);
        $('.igst-row').toggle(isInterState);
    }

    // --- Calculation ---
    function calculateRow($tr) {
        const qty = parseFloat($tr.find('.qty-field').val()) || 0;
        const rate = parseFloat($tr.find('.rate-field').val()) || 0;
        const gstPct = parseFloat($tr.find('.gst-pct-field').val()) || 0;
        const rateType = $tr.find('.rate-type-field').val();
        const discType = $tr.find('.disc-type-field').val();
        const discVal = parseFloat($tr.find('.disc-val-field').val()) || 0;

        let preTaxRate = rate;
        if (rateType === "W. TAX") {
            preTaxRate = rate / (1 + (gstPct / 100));
        }

        const preTaxSubtotal = qty * preTaxRate;
        let discAmt = (discType === "PERCENTAGE") ? (preTaxSubtotal * discVal / 100) : discVal;

        const taxableAmt = preTaxSubtotal - discAmt;
        const taxAmt = taxableAmt * (gstPct / 100);
        const rowTotal = taxableAmt + taxAmt;

        $tr.find('.row-total-display').text(rowTotal.toFixed(2));
        $tr.find('input[name="amount[]"]').val(rowTotal.toFixed(2));
        $tr.find('input[name="disc_amt[]"]').val(discAmt.toFixed(2));

        $tr.data('taxable', taxableAmt);
        $tr.data('tax', taxAmt);
        $tr.data('discount', discAmt);

        calculateSummary();
    }

    function calculateSummary() {
        let gross = 0, discount = 0, tax = 0;
        $itemTableBody.find('tr').each(function () {
            gross += parseFloat($(this).data('taxable')) || 0;
            tax += parseFloat($(this).data('tax')) || 0;
            discount += parseFloat($(this).data('discount')) || 0;
        });

        const addAmt = parseFloat($('#addCharge').val()) || 0;
        const lessAmt = parseFloat($('#lessCharge').val()) || 0;
        let final = gross + tax + addAmt - lessAmt;

        let roundOffVal = 0;
        if ($roundOffToggle.is(':checked')) {
            const rounded = Math.round(final);
            roundOffVal = rounded - final;
            final = rounded;
        }

        $('#preTaxAmountLabel').text(gross.toFixed(2));
        $('#totalDiscountLabel').text(discount.toFixed(2));
        $('#SGSTLabel').text((tax / 2).toFixed(2));
        $('#CGSTLabel').text((tax / 2).toFixed(2));
        $('#IGSTLabel').text(tax.toFixed(2));
        $('#roundOffLabel').text(roundOffVal.toFixed(2));
        $('#totalAmountLabel').text(final.toFixed(2));

        $('#preTaxAmount').val(gross.toFixed(2));
        $('#totalDiscount').val(discount.toFixed(2));
        $('#SGST').val((tax / 2).toFixed(2));
        $('#CGST').val((tax / 2).toFixed(2));
        $('#IGST').val(tax.toFixed(2));
        $('#roundOff').val(roundOffVal.toFixed(2));
        $('#totalAmount').val(final.toFixed(2));
    }

    // --- Helpers ---
    function showSearchMenu($input, list, onSelect, labelFn = null) {
        let $menu = $('.floating-dropdown');
        if (!$menu.length) {
            $menu = $('<div class="floating-dropdown card shadow"></div>').appendTo('body');
        }
        $menu.empty();
        const rect = $input[0].getBoundingClientRect();
        $menu.css({
            position: 'absolute',
            left: rect.left,
            top: rect.bottom + window.scrollY,
            width: rect.width,
            zIndex: 3000,
            background: 'white',
            maxHeight: '200px',
            overflowY: 'auto'
        });

        const items = (list && list.data) ? list.data : (Array.isArray(list) ? list : []);
        if (!items.length) { $menu.hide(); return; }

        items.forEach(item => {
            $('<div class="dropdown-item"></div>')
                .text(labelFn ? labelFn(item) : (item.name || item.itemname))
                .on('mousedown', () => { onSelect(item); $menu.hide(); })
                .appendTo($menu);
        });
        $menu.show();
        $input.on('blur', () => setTimeout(() => $menu.hide(), 200));
    }

    // --- Modal Logic ---
    function openSerialModal(index, qty) {
        const $container = $('#serialInputsContainer');
        $container.empty();
        for (let i = 1; i <= qty; i++) {
            $container.append(`<div class="field-item mb-10"><label>Serial No. ${i}</label><input type="text" class="input-styled serial-input" placeholder="Enter Serial Number"></div>`);
        }
        $('#serialModal').show();
        $('#saveSerialsBtn').off('click').on('click', function () {
            const serials = [];
            $container.find('.serial-input').each(function () { if ($(this).val()) serials.push($(this).val()); });
            $(`#itemserialNumber_${index}`).val(serials.join(', '));
            $('#serialModal').hide();
        });
    }

    $('.close, .btn-cancel').on('click', function () {
        $('.modal').hide();
    });

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- Sidebar & General Events ---
    $('.sidebar-nav li[data-page]').on('click', function () {
        if ($(this).hasClass('has-submenu')) {
            $(this).find('.submenu').slideToggle();
            $(this).find('.chevron').toggleClass('down');
        } else {
            const page = $(this).data('page');
            if (page === 'dashboard' || page === 'generic' || page === 'customer') {
                alert(`Navigating to ${$(this).text().trim()}...`);
            }
        }
        $('.sidebar-nav li').removeClass('active');
        $(this).addClass('active');
    });

    $('#fullScreenBtn').on('click', function () {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => alert(err.message));
        } else {
            document.exitFullscreen();
        }
    });

    $addRowBtn.on('click', createTableRow);
    $addRowFooterBtn.on('click', createTableRow);
    $roundOffToggle.on('change', calculateSummary);
    $('#addCharge, #lessCharge').on('input change', calculateSummary);

    $billType.on('change', function () {
        const isAmc = $(this).val() === "AMC";
        $('#amcTypeContainer').toggle(isAmc);
        if (isAmc) loadAMCTypes();
    });

    $installationToggle.on('change', function () {
        $('#instDateContainer').toggle($(this).val() === "Yes");
    });

    $('#addCustomerBtn').on('click', () => $('#customerModal').show());
    $('#changeShipBtn').on('click', () => alert("Address selection feature coming soon!"));

    $('.btn-save, .btn-save-modal').on('click', function () {
        const btnId = $(this).attr('id');
        if (btnId === 'saveCustBtn') {
            alert("Customer saved successfully!");
            $('.modal').hide();
        } else {
            alert("Record saved successfully!");
        }
    });

    // --- Finalization ---
    initPage();
});
