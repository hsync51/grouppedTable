/// <reference path="../underscore.min.js" />
/// <reference path="../highcharts/4.2.0/highcharts.js" />
var tarihMi = false;
var properties = [];
var orderColumn;
var groupHeaderTemlateCallback = null;
var model = [];
var $tableHeaders;
var groupper = $.widget("custom.groupper",
{
    options: {
        //data listesi json veya dizi olabilir
        list: {},
        //Grouplanacak column
        grouppedColumn: "",
        //toplamı alınmayacak number tipinde kolonlar 
        //boş gelirse tipi number olan bütün colonların toplamı grouplama sırasında alınır.
        TotalColumns: [],
        changeValue: null,
        isOrdered: true,
        groupHeaderTemlate: null,
        chartElementId: null
    },
    _create: function () {
        model= this.options.list;
        this.element.addClass("tablegroupper");
        var wiget = this;
        var $table = $(this.element);
        $tableHeaders = $table.find("th");

        if (this.options.isOrdered) {
            $tableHeaders.click(function () {
                var column = $(this).data("prop");
                if (column) {
                    orderColumn = column;
                    wiget.refresh(false);
                }

            });

        }
        this.refresh(true);
    },
    _setOption: function (key, value) {
        if (key === "groupByColumn") {
            this._super("grouppedColumn", value);
        }
        this._super(key, value);

    },
    _setOptions: function (options) {
        this._super(options);
        this.refresh(true);
    },
    refresh: function (updateChart) {
        var istatistikler = this.options.list;
        var propertName = this.options.grouppedColumn;
        var includes = this.options.TotalColumns;
        var changeValueCallBack = this.options.changeValue;
        groupHeaderTemlateCallback = this.options.groupHeaderTemlate;
        var isOrdered = this.options.isOrdered;
        var chartElementId = this.options.chartElementId;

        var $table = $(this.element);
        if (istatistikler.length <= 0) {

            $table.before("<h2>Herhangi bir sonuç bulunamadı</h2>");
            $table.remove();
            return;
        }
        var headers = $table.find("th");
        properties = [];
        for (var i = 0; i < headers.length; i++) {
            var ozellik = $(headers[i]).data("prop");
            properties.push(ozellik);
            $(headers[i]).addClass("tablegroupper-header");
        }

        if (istatistikler.length > 0) {
            var deger = istatistikler[0][propertName];
            var type = $.type(deger);
            tarihMi = type === "date";
        }

        var propertiesLength = properties.length;
        var table = "";
        var gropped = _.groupBy(istatistikler, propertName);
        _.forEach(gropped,
            function (e, i) {
                if (i !== "undefined") {

                    var haderhtm = getGroupHeader(propertName, i, e[0]);
                    table += '<tr class="group-header removal"><td colspan="' + propertiesLength + '"><i></i>' + haderhtm + ' (' + e.length + ')</td></tr>';
                }

                var temp = "";
                var renk = "odd";

                //siralama işlemi
                var objects = e;
                if (isOrdered && orderColumn) {
                    objects = _.sortBy(e, orderColumn);
                    var sortedColumn = $('.tablegroupper-header[data-prop="' + orderColumn + '"]');
                    if (sortedColumn.hasClass("tablegroupper-headerAsc")) {
                        sortedColumn.removeClass("tablegroupper-headerAsc");
                        sortedColumn.addClass("tablegroupper-headerDesc");
                        objects = objects.reverse();
                    } else {
                        sortedColumn.removeClass("tablegroupper-headerDesc");
                        sortedColumn.addClass("tablegroupper-headerAsc");

                    }


                }

                _.forEach(objects,
                    function (e1, i1) {
                        temp = "";
                        for (var j = 0; j < propertiesLength; j++) {
                            var ozellik = properties[j];
                            if (ozellik === propertName) {
                                temp += '<td> </td>';
                                continue;
                            }
                            var value = e1[ozellik];
                            var type = $.type(value);
                            if (type === "date") {
                                value = value.toLocaleString();
                            }
                            else if (type === "null") {
                                value = "";
                            }
                            if ($.isFunction(changeValueCallBack)) {
                                var callBackval = changeValueCallBack(ozellik, value);
                                if (callBackval)
                                    value = callBackval;
                            }

                            temp += '<td>' + value + '</td>';
                        }

                        renk = (renk === "even") ? "odd" : "even";
                        var konusmaMetni = e1["KonusmaMetni"];
                        if (konusmaMetni) {
                            temp += '<td class="tr-konusmaMetni" colspan="5"><i></i> ' + konusmaMetni.replace(/\r?\n|\r/g, '<br>').replace(/\t/g, '            ') + '</td>';
                        }

                        table += '<tr class="' + renk + '">' + temp + '</tr>';
                        
                    });
                var trToplam = "";
                var hasTotal = false;
                for (var j = 0; j < propertiesLength; j++) {
                    if (typeof e[0][properties[j]] === "number" && (_.contains(includes, properties[j]))) {

                        var totalProp = _.reduce(e, function (memo, num) { return memo + num[properties[j]]; }, 0);
                        if ($.isFunction(changeValueCallBack)) {
                            var callBackval = changeValueCallBack(properties[j], totalProp);
                            if (callBackval)
                                totalProp = callBackval;
                        }
                        hasTotal = true;
                        trToplam += '<td>' + totalProp + '</td>';
                    } else {
                        trToplam += '<td>' + '</td>';
                    }

                }
                if (hasTotal) {
                    table += '<tr class="trtotal">' + trToplam + '</tr>';
                }
                
            });
        $table.find("tbody").detach();
        $table.append("<tbody></tbody>");
        //table html binding ve gropulanmış columnların açılıp kapanması
        setTimeout(function () {
            $table.find("tbody").html(table);
            $table.find("tbody tr.group-header").click(function () {
                //alert($(this).html());
                //alert($(this).nextUntil("tr.group-header").length);
                var $grouptr = $(this);
                if ($grouptr.hasClass("collapsed")) {
                    $grouptr.removeClass("collapsed");
                    $grouptr.nextUntil("tr.group-header").removeClass("group-hidden");
                } else {
                    $grouptr.addClass("collapsed");
                    $grouptr.nextUntil("tr.group-header").addClass("group-hidden");
                }

            });

        }, 0);
        AddTableGrouperPropertiesToComboBox(this.element, headers, propertName);
        if (updateChart) {
            CreateChart(this.element, chartElementId, gropped, propertName);
        }

    },
    groupByColumn: function (columnName) {
        this.options.grouppedColumn = columnName;
        this.refresh(true);
    },
    drilldown: function (array) {
        this.options.list = array;
        this.refresh(true);
    }

});

function AddTableGrouperPropertiesToComboBox(element, tableRows, grouppedColumn) {

    var $target = $(element);
    var ifExist = $("#dvselect_grouple_objects");
    if (ifExist.length === 0) {


        var html = '<div id="dvselect_grouple_objects" class="noPrint" style="float:left;background-color:#99bfe6;width:100%;"><div style="float:left;">'+
                                '<input type="button" id="tblGroupperbtnYenile" value="Başa Dön" style="height:20px;line-height:0" />' +
                                '<input type="button" id="tblGroupperbtnGrupKapat" value="Daralt" style="height:20px;line-height:0" />' +
                                '</div><div style="float:right"><span>Gruplama Türü:  </span><select id="slt_grouple_items">';

        html += '<option value="">Seçiniz</>';
        for (var i = 0; i < tableRows.length; i++) {
            var $row = $(tableRows[i]);
            var dataprop = $row.data("prop");
            var selected = dataprop === grouppedColumn ? "selected" : "";
            var option = '<option value="' + dataprop + '" ' + selected + '>' + $row.text() + '</option>';
            html += option;
        }
        html += "</select></div></div>";
        $target.before(html);
        $("#slt_grouple_items")
            .change(function () {
                var groupProperty = $(this).val();
                $target.groupper({ "groupByColumn": groupProperty });
            });

        $("#tblGroupperbtnYenile")
            .click(function () {
                $(this).val("Bekleyiniz");
                $target.groupper({ list: model });
                $(this).val("Başa Dön");
            });

        $("#tblGroupperbtnGrupKapat")
            .click(function () {
                var value = $(this).val();

                if (!value||value=="Daralt") {
                    value = "Genişlet";
                    $("tr.group-header").addClass("collapsed");
                    $("tr.even,tr.odd").addClass("group-hidden");

                }
                else if (value == "Genişlet") {
                    value = "Daralt";
                    $("tr.group-header").removeClass("collapsed");
                    $("tr.even,tr.odd").removeClass("group-hidden");

                }
                $(this).val(value);
            });
    }

}


function getGroupHeader(propName, index, firstItem) {
    var deger = index;
    if (tarihMi) {
        deger = new Date(index);
    }
    if ($.isFunction(groupHeaderTemlateCallback)) {
        var groupHeaderTmp = groupHeaderTemlateCallback(propName, index, firstItem);
        if (groupHeaderTmp)
            deger = groupHeaderTmp;
    }
    return deger.toLocaleString();
}

function CreateChart(tableElement, chartElementId, list, grouppedProperty) {

    if (chartElementId) {

        var $target = $(tableElement);
        Highcharts.setOptions({
            lang: {
                drillUpText: '<< Geri Dön'
            }
        });


        var data = [];
        //var gropped = _.groupBy(list, grouppedProperty);
        _.forEach(list,
            function (e, i) {
                var nameHtm = getGroupHeader(grouppedProperty, i, e[0]);

                data.push({ name: nameHtm, y: e.length, drilldown: true, data: e });
            });

        $('#' + chartElementId).highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie',
                height: 600,
                events: {
                    drilldown: function (e) {
                        console.log(e.point.data);
                        $target.groupper({ list: e.point.data });
                    }
                }
            },
            title: {
                text: ''
            },
            tooltip: {
                pointFormat: '<b>% {point.percentage:.1f} </b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}</b>: {point.y}',
                        style: {
                            width: '200px',
                            whiteSpace: 'nowrap'
                        }
                    }
                }
            },
            series: [
                {
                    name: 'Sayı',
                    colorByPoint: true,
                    data: data
                }],
            drilldown: {
                series: []
            }

        });
    }

}