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
        $.get(`${API_BASE}getsalesinvno.php`, function (data) {
            if (data) {
                $('#invoiceNumber').val((data.invoice_prefix || "") + (data.invno || ""));
                $('#transactionId').val(data.invno || "");
                $('#invoiceNumber').attr('data-state', data.company_state || "");
                companyState = data.company_state || "";
            }
        }, 'json').fail(err => console.error("Error fetching inv no:", err));

        loadTerms();
        createTableRow(); // Add initial row
    }

    // --- API: Load Terms ---
    function loadTerms() {
        $.get(`${API_BASE}termsandconditionlist.php`, function (data) {
            const $select = $('#termsAndConditionsDD');
            if (data && data.terms) {
                data.terms.forEach(t => {
                    $select.append($('<option>', {
                        value: t.name,
                        text: t.name,
                        'data-desc': t.description
                    }));
                });
            }
            $select.on('change', function () {
                const desc = $(this).find(':selected').data('desc');
                $('#termsAndConditionsDesc').val(desc || "");
            });
        }, 'json');
    }

    // --- API: Load AMC Type ---
    function loadAMCTypes() {
        $.get(`${API_BASE}amctype.php?amctype`, function (data) {
            const $select = $('#AMCType');
            $select.empty().append('<option value="">Select Option</option>');
            if (data && data.amctype) {
                data.amctype.forEach(a => {
                    $select.append($('<option>', { value: a.id, text: a.name }));
                });
            }
        }, 'json');
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
                    <input type="number" id="itemDiscValue_${index}" value="0" class="input-styled disc-val-field">
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

        $nameInput.on('input', debounce(() => searchItems($nameInput, $tr), 300));

        $tr.find('input, select').on('input', () => calculateRow($tr));

        $tr.find('.remove-row-btn').on('click', function () {
            $tr.remove();
            calculateSummary();
        });

        $tr.find('.btn-sr-no').on('click', function () {
            const qty = $tr.find('.qty-field').val();
            openSerialModal(index, qty);
        });
    }

    // --- Search Logic ---
    function searchItems($input, $tr) {
        const term = $input.val();
        if (term.length < 2) return;
        $.getJSON(`${API_BASE}fetch_allitem.php?searchTerm=${term}`, function (items) {
            showSearchMenu($input, items, item => {
                $input.val(item.itemname);
                $tr.find('input[name="item_id[]"]').val(item.id);
                fetchItemDetails(item.id, $tr);
            });
        });
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
            showSearchMenu($companySearch, customers, cust => {
                $companySearch.val(cust.name);
                $selectedCustomerId.val(cust.id);
                fetchCustomerDetails(cust.id);
            }, c => `${c.name} - ${c.contact}`);
        });
    }, 300));

    function fetchCustomerDetails(id) {
        $.getJSON(`${API_BASE}customer.php?getcustomerid=${id}`, function (resp) {
            if (resp && resp.data && resp.data[0]) {
                const c = resp.data[0];
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
        });
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

        const items = list.data || list;
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

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- Sidebar & General Events ---
    $('.sidebar-nav li[data-page]').on('click', function () {
        $('.sidebar-nav li').removeClass('active');
        $(this).addClass('active');
        if ($(this).hasClass('has-submenu')) {
            $(this).find('.submenu').slideToggle();
            $(this).find('.chevron').toggleClass('down');
        }
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
    $('#addCharge, #lessCharge').on('input', calculateSummary);

    $billType.on('change', function () {
        const isAmc = $(this).val() === "AMC";
        $('#amcTypeContainer').toggle(isAmc);
        if (isAmc) loadAMCTypes();
    });

    $installationToggle.on('change', function () {
        $('#instDateContainer').toggle($(this).val() === "Yes");
    });

    // --- Finalization ---
    initPage();
});
