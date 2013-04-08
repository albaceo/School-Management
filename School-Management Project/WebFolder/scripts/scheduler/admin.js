﻿function initScheduler(containerID , date, view , syncObj) {
    var
    compoID 		= 'timeTableDetails',
    rangeCompoID	= 'timeRangeDetails',
    dataSources 	= [
    {
        name: 'teacher',
        global: false,
        mapAttr: 'teacherID',
        getAll: false
    },
    {
        name: 'studyGroup',
        global: false,
        mapAttr: 'studyGroupID'
    },
    {
        name: 'course',
        global: false,
        mapAttr: 'courseID'
    },
    {
        name: 'classroom',
        global: false,
        mapAttr: 'classroomID'
    }
    ],
    validationRules = [
    {
        selector: '#timeRangeDetails_date',//date
        rule	: function(event_object){
        	var workingDays = scheduler.config.workingDays || [];
        	
        	if(event_object.start_date && event_object.end_date && (workingDays.indexOf(event_object.start_date.getDay()) < 0 || workingDays.indexOf(event_object.end_date.getDay())<0)){
	            return false;
	        }
	        
	        return true;
        },
        key		: 'prevent_add_course',
        code	: '000'
    },
    {
        selector: '#timeRangeDetails_date',//date
        rule	: 'notEmpty',
        key		: 'sdate_mandatory',
        attr	: 'start_date',
        code	: '001'
    },
    {
        selector: '#timeRangeDetails_date',//end_date
        rule	: 'notEmpty',
        key		: 'edate_mandatory',
        attr	: 'end_date',
        code	: '002'
    },
    {
        selector: '#timeTableDetails_combobox1', //classroom
        rule	: 'notEmpty',
        key		: 'cr_mandatory',
        attr	: 'classroomID',
        code	: '001'
    },
    {
        selector: '#timeTableDetails_combobox2', // Course
        rule	: 'notEmpty',
        key		: 'course_mandatory',
        attr	: 'courseID',
        code	: '003'
    },
    {
        selector: '#timeTableDetails_combobox3', // StudyGroup
        rule	: 'notEmpty',
        key		: 'grade_mandatory',
        attr	: 'studyGroupID',
        code	: '004'
    },
    {
        selector: '#waf-temp-container-timeTableDetails_matrix1', // Teacher
        rule	: 'notEmpty',
        key		: 'teacher_mandatory',
        attr	: 'teacherID',
        code	: '005'
    }
    ]
    mappingObj = _ns.Mapping.getInstance();
    mappingObj.init(syncObj.fields , syncObj.dataSource.getDataClass());
	
    function validator(event_obj){
    	if(typeof this.rule == 'function'){
    		return this.rule(event_obj)
    	}
    	
        switch(this.rule){
            case 'notEmpty':
                if(!event_obj[this.attr]){
                    return false;
                }
                break;
        }
		
        return true;
    }
    
    function initErrors(){
    	$(scheduler.getLightbox()).find('.sm-error').removeClass('sm-error');
    }
	  	
    function validateEvent(event_object){
    	var
        msg         = _ns.Message.getInstance(),
        res         = {
            errors  : [],
            wornings: [],
            valid	: true
        };
		
		initErrors();
		
        for(var i = 0 , rule ; rule = validationRules[i] ; i++){
            var
            $widget = $(rule.selector);
			
            if(!validator.call(rule , event_object)){
                msg.append( rule.key , {});
                $widget.addClass('sm-error');
            }
        }
		
        if(msg.getStack().length){
            msg.display({
                options	: {
                    type    : 'dialog-error',
                    title   : 'Errors',
                    css     : {
                    	'text-align' : 'left'
                    }
                }
            });
			
            res.valid = false;
        }
		
        return res;
    }
	
    function refreshEvent(id){
        var
        that			= this,
        event_object 	= that.getEvent(id),
        dc 				= syncObj.dataSource.getDataClass();
		
        if(event_object && dc){
            dc.getEntity(id , {
                onSuccess: function(ev){
                    var obj = mappingObj.getObjectFromEntity(ev.entity);
			    	
                    for(var attr in obj){
                        if(attr != 'id' && obj.hasOwnProperty(attr)){
                            event_object[attr] = obj[attr];
                        }
                    }
			    	
                    that.changeEventId(id , ev.entity.getKey())
                    that.updateEvent(id);
                },
                onError: function(){
			    	
                }
            })
        }
    }
  		
    function fixDataSources(ev_object){
        for(var i = 0 , dataS ; dataS = dataSources[i] ; i++ ){
            var name = dataS.global ? dataS.name : compoID + '_' + dataS.name;
            if(sources[name]){
                if(dataS.getAll){
                    sources[name].all({
                        onSuccess: function(ev){
                            ev.dataSource.selectByKey(ev_object[ev.userData.mapAttr]);
                        },
                        userData: dataS
                    });
                }
                else{
                    sources[name].selectByKey(ev_object[dataS.mapAttr]);
                }
            }
        }
    }
	
    function fixTimeRange(ev_object){
        var
        begin 	= ev_object.start_date,
        end		= ev_object.end_date;
		
        $$(rangeCompoID)._setTime({
            date	: begin,
            begin	: begin.getHours()*60 + begin.getMinutes(),
            end 	: end.getHours()*60 + end.getMinutes()
        });
    }
	
    function refreshFromEntity(entity){
        var
        mapObj 	= _ns.Mapping.getInstance(),
        obj 	= mapObj.getObjectFromEntity(entity),
        ev_obj 	= scheduler.getEvent(entity.getKey());
		
        for(var attr in obj){
            if(obj.hasOwnProperty(attr) && attr != 'id'){
                ev_obj[attr] = obj[attr];
            }
        }
		
        ev_obj.color = mapObj.getColorValue(entity);
		
        scheduler.updateEvent(entity.getKey());
    }

    scheduler.config = $.extend({} , scheduler.config , ds.School.getSchedulerConfig());
    scheduler.config = $.extend({} , scheduler.config , {
        buttons_left: ["dhx_cancel_btn" , "dhx_delete_btn"],
        buttons_right: ["dhx_save_btn"]
    });
	
    scheduler.locale.labels = $.extend({} , scheduler.locale.labels , {
        section_timeTableDetails: '',
        section_time: ''
    });
	
    scheduler.form_blocks = $.extend({} , scheduler.form_blocks , {
        'timeTable_details' : {
            render:function(sns){ //sns - section configuration object
                return '<div id="' + compoID + '" data-type="component" data-constraint-top="true" style="height:286px" data-constraint-left="true" class="waf-widget waf-component default inherited"></div>';
            },
            set_value:function(node,value,ev){
                if($(node).children().length){
                    fixDataSources(ev);
                }
            },
            get_value:function(node,ev){
                var
                dc		= _ns.Mapping.dc,
                mapObj 	= _ns.Mapping.getInstance();
				
                for(var i = 0 , dataS ; dataS = dataSources[i] ; i++ ){
                    var
                    name 	= dataS.global ? dataS.name : compoID + '_' + dataS.name,
                    dsource = sources[name];
					
                    if(dsource && dsource.getCurrentElement()){
                        ev[dataS.mapAttr] = dsource.getCurrentElement().getKey();
                    }
                }
				
                var
                t = $$(rangeCompoID)._getSchedulerTime();
				
                ev.start_date 	= t.start_date;
                ev.end_date		= t.end_date;
            }
        },
        'time_range' : {
            render:function(sns){
                return '<div id="' + rangeCompoID + '" data-type="component" data-constraint-top="true" style="height:65px" data-constraint-left="true" class="waf-widget waf-component default inherited"></div>';
            },
            set_value:function(node,value,ev){
                if($(node).children().length){
                    fixTimeRange(ev);
                }
            },
            get_value:function(node,ev){
            // have been done in the "timeTable_details" section !
            }
        }
    });
	
    scheduler.config = $.extend({} , scheduler.config , {
        lightbox: {
            sections: [
            {
                name:"time", 
                height:72, 
                type:"time", 
                map_to:"auto"
            },

            {
                name:"timeRange", 
                height:72, 
                type:"time_range", 
                map_to:"auto"
            },

            {
                name: "recurring", 
                type: "recurring", 
                map_to: "rec_type", 
                button: "recurring"
            },

            {
                name:"timeTableDetails", 
                height:250, 
                type:"timeTable_details", 
                map_to:"auto"
            }
            ]
        }
    });
	
    scheduler.attachEvent("onEventChanged", function(event_id,event_object){
        var validation = validateEvent.call(this , event_object);
        if(validation.valid && event_id.toString().indexOf('#') < 0){
            var
            res = ds.TimeTable.editItem(event_id , mappingObj.getObject(event_object));
			
            if(res && res.getKey){
                if(event_id != res.getKey()){
                    scheduler.changeEventId(event_id , res.getKey());
                }
				
                refreshFromEntity(res);
            }
        }
		
        else if(!validation.valid){
            ds.TimeTable.getEntity(event_id , {
                forceReload : true,
                onSuccess: function(e){
                    if(e.entity){
                        refreshFromEntity(e.entity);
                    }
                }
            })
        }
    });
  	
    scheduler.attachEvent("onBeforeEventDelete", function(event_id,event_object){
        if(event_object.event_pid){
            return ds.TimeTable.editItem(event_id , mappingObj.getObject(event_object));
        }
        else if(ds.TimeTable.editItem(event_id , mappingObj.getObject(event_object) , true)){
            return true;
        }
		
        return false;
    });
  	
    scheduler.attachEvent("onEventAdded", function(event_id,event_object){
        var validation = validateEvent.call(this , event_object);
        if(validation.valid){
            var res = ds.TimeTable.editItem(event_id , mappingObj.getObject(event_object));
            if(res && res.getKey){
                scheduler.changeEventId(event_id , res.getKey());
                refreshFromEntity(res);
            }
        }
    });
	
    scheduler.attachEvent("onEventSave",function(id,data,is_new_event){
        var validator = validateEvent.call(this , data);
        return validator.valid;
    });
  	
    scheduler.attachEvent("onLightbox", function (event_id){
        var
        event_object	= this.getEvent(event_id);
  		
        if(!$$(compoID)){
            var compo = $('#' + compoID);
            var compoWidget = new WAF.widget.Component({
                'id': compo.attr('id'),
                'data-lib': 'WAF',
                'data-type': 'component',
                'data-theme': 'metal inherited'
            });
            compoWidget.loadComponent({
                path: '/components/selectTimeTableDetails.waComponent',
                onSuccess: function(){
                    fixDataSources(event_object);
                }
            });
        }
  		
        if(!$$(rangeCompoID)){
            var rangeCompo = $('#' + rangeCompoID);
            var rangeWebCompo = new WAF.widget.Component({
                'id': rangeCompo.attr('id'),
                'data-lib': 'WAF',
                'data-type': 'component',
                'data-theme': 'metal inherited'
            });
			
            rangeWebCompo.loadComponent({
                path: "/components/selectTimeRange.waComponent",
                onSuccess: function(){
                    scheduler.setLightboxSize();
					
                    $$(this.id)._setMinTime(scheduler.config.first_hour*60);
                    $$(this.id)._setMaxTime(scheduler.config.last_hour*60);
					
                    fixTimeRange(event_object);
                }
            });
        }
  		
        var
        checkb,
        customBtn,
        tSection	= scheduler.formSection('time'),
        trSection 	= scheduler.formSection('timeRange'),
        ttDSection	= scheduler.formSection('timeTableDetails'),
        rSection	= scheduler.formSection('recurring');
        
        initErrors();
  		
        $(rSection.node).find('input[name=date_of_end]').datepicker({
            changeMonth: true, 
            changeYear: true
        });
  		
        $(trSection.header).hide();
        $(tSection.node).parent().hide();
        $(ttDSection.header).hide().parent().css({
            'background-color' : 'rgb(234, 233, 233)'
        });
        $(trSection.node).parent().css({
            'background-color' : 'rgb(234, 233, 233)'
        });
  		
        customBtn = $(rSection.header).find('.dhx_custom_button').hide();
        checkb	= $(rSection.header).find('.checkb');
  		
        if(!checkb.length){
            checkb	= $('<input type="checkbox" class="checkb">').click(function(){
                var
                f = rSection.header,
                e = scheduler.form_blocks["recurring"];
	  			
                e.button_click('1' , customBtn.children().get(0) , f , f.nextSibling);
            });
	  		
            customBtn.after(checkb)
        }
	  	
        checkb.prop('checked' , event_object.rec_type ? true : false);
    });
	
    scheduler.renderEvent = function(container , ev){
        var
        $cont = $(container);
	 
        var html = "<div class='dhx_event_move dhx_header event_subElement' style='width:100%'>&nbsp;</div>";
	 	
        html+= '<div class="dhx_event_move dhx_title event_subElement" style="height:15px;">' 
        + scheduler.templates.event_date(ev.start_date) 
        + ' - ' + scheduler.templates.event_date(ev.end_date) + '</div>';
	 	
        html+= '<div class="dhx_event_move dhx_body event_subElement" style="cursor:pointer;width:' + ( $cont.width() - 10) + 'px;height:' + ( $cont.height() - 32) + 'px">';
		
        html+= ev.text;
		
        html += "</div>";
	 
        // resize section
        html += "<div class='dhx_event_resize dhx_footer event_subElement' style='width:100%'></div>";
		
        $cont.append(html).find('.event_subElement').css({
            'background-color' : ev.color
        });
		
        return true;
    }
	
    var
    labelChanges = [
    {
        oldVal	: 'value="1" />day',
        newVal	: 'value="1" />day(s)'
    },
    {
        oldVal	: 'value="1" />month',
        newVal	: 'value="1" />month(s)'
    },
    {
        oldVal	: 'Every workday',
        newVal	: 'Every weekday'
    },
    {
        oldVal	: 'week next days:',
        newVal	: 'week(s) on:'
    },
    {
        oldVal	: 'day every',
        newVal	: 'day(s) every'
    },
    {
        oldVal	: 'occurrences',
        newVal	: 'occurrence(s)'
    }
    ]
	
    for(var i = 0 , ch ; ch = labelChanges[i] ; i++){
        scheduler.__recurring_template = scheduler.__recurring_template.replace(new RegExp(ch.oldVal , 'g') , ch.newVal);
    }
  	
    $('#' + containerID).addClass('dhx_cal_container calendar');
    scheduler.init(containerID , date , view);
	
    return _ns.syncWithDS(syncObj);
}