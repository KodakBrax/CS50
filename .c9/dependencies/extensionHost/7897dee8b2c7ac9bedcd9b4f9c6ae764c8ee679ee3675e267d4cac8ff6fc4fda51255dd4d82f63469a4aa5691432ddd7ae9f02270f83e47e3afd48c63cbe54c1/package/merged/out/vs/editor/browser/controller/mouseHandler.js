/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/editor/browser/controller/mouseTarget", "vs/editor/browser/editorDom", "vs/editor/common/config/editorZoom", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/common/viewModel/viewEventHandler"], function (require, exports, browser, dom, mouseEvent_1, async_1, lifecycle_1, platform, mouseTarget_1, editorDom_1, editorZoom_1, position_1, selection_1, viewEventHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Merges mouse events when mouse move events are throttled
     */
    function createMouseMoveEventMerger(mouseTargetFactory) {
        return function (lastEvent, currentEvent) {
            let targetIsWidget = false;
            if (mouseTargetFactory) {
                targetIsWidget = mouseTargetFactory.mouseTargetIsWidget(currentEvent);
            }
            if (!targetIsWidget) {
                currentEvent.preventDefault();
            }
            return currentEvent;
        };
    }
    class MouseHandler extends viewEventHandler_1.ViewEventHandler {
        constructor(context, viewController, viewHelper) {
            super();
            this._isFocused = false;
            this._context = context;
            this.viewController = viewController;
            this.viewHelper = viewHelper;
            this.mouseTargetFactory = new mouseTarget_1.MouseTargetFactory(this._context, viewHelper);
            this._mouseDownOperation = this._register(new MouseDownOperation(this._context, this.viewController, this.viewHelper, (e, testEventTarget) => this._createMouseTarget(e, testEventTarget), (e) => this._getMouseColumn(e)));
            this._asyncFocus = this._register(new async_1.RunOnceScheduler(() => this.viewHelper.focusTextArea(), 0));
            this.lastMouseLeaveTime = -1;
            const mouseEvents = new editorDom_1.EditorMouseEventFactory(this.viewHelper.viewDomNode);
            this._register(mouseEvents.onContextMenu(this.viewHelper.viewDomNode, (e) => this._onContextMenu(e, true)));
            this._register(mouseEvents.onMouseMoveThrottled(this.viewHelper.viewDomNode, (e) => this._onMouseMove(e), createMouseMoveEventMerger(this.mouseTargetFactory), MouseHandler.MOUSE_MOVE_MINIMUM_TIME));
            this._register(mouseEvents.onMouseUp(this.viewHelper.viewDomNode, (e) => this._onMouseUp(e)));
            this._register(mouseEvents.onMouseLeave(this.viewHelper.viewDomNode, (e) => this._onMouseLeave(e)));
            this._register(mouseEvents.onMouseDown(this.viewHelper.viewDomNode, (e) => this._onMouseDown(e)));
            const onMouseWheel = (browserEvent) => {
                this.viewController.emitMouseWheel(browserEvent);
                if (!this._context.configuration.editor.viewInfo.mouseWheelZoom) {
                    return;
                }
                const e = new mouseEvent_1.StandardWheelEvent(browserEvent);
                if (e.browserEvent.ctrlKey || e.browserEvent.metaKey) {
                    const zoomLevel = editorZoom_1.EditorZoom.getZoomLevel();
                    const delta = e.deltaY > 0 ? 1 : -1;
                    editorZoom_1.EditorZoom.setZoomLevel(zoomLevel + delta);
                    e.preventDefault();
                    e.stopPropagation();
                }
            };
            this._register(dom.addDisposableListener(this.viewHelper.viewDomNode, browser.isEdgeOrIE ? 'mousewheel' : 'wheel', onMouseWheel, true));
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
        // --- begin event handlers
        onCursorStateChanged(e) {
            this._mouseDownOperation.onCursorStateChanged(e);
            return false;
        }
        onFocusChanged(e) {
            this._isFocused = e.isFocused;
            return false;
        }
        onScrollChanged(e) {
            this._mouseDownOperation.onScrollChanged();
            return false;
        }
        // --- end event handlers
        getTargetAtClientPoint(clientX, clientY) {
            const clientPos = new editorDom_1.ClientCoordinates(clientX, clientY);
            const pos = clientPos.toPageCoordinates();
            const editorPos = editorDom_1.createEditorPagePosition(this.viewHelper.viewDomNode);
            if (pos.y < editorPos.y || pos.y > editorPos.y + editorPos.height || pos.x < editorPos.x || pos.x > editorPos.x + editorPos.width) {
                return null;
            }
            const lastViewCursorsRenderData = this.viewHelper.getLastViewCursorsRenderData();
            return this.mouseTargetFactory.createMouseTarget(lastViewCursorsRenderData, editorPos, pos, null);
        }
        _createMouseTarget(e, testEventTarget) {
            const lastViewCursorsRenderData = this.viewHelper.getLastViewCursorsRenderData();
            return this.mouseTargetFactory.createMouseTarget(lastViewCursorsRenderData, e.editorPos, e.pos, testEventTarget ? e.target : null);
        }
        _getMouseColumn(e) {
            return this.mouseTargetFactory.getMouseColumn(e.editorPos, e.pos);
        }
        _onContextMenu(e, testEventTarget) {
            this.viewController.emitContextMenu({
                event: e,
                target: this._createMouseTarget(e, testEventTarget)
            });
        }
        _onMouseMove(e) {
            if (this._mouseDownOperation.isActive()) {
                // In selection/drag operation
                return;
            }
            const actualMouseMoveTime = e.timestamp;
            if (actualMouseMoveTime < this.lastMouseLeaveTime) {
                // Due to throttling, this event occurred before the mouse left the editor, therefore ignore it.
                return;
            }
            this.viewController.emitMouseMove({
                event: e,
                target: this._createMouseTarget(e, true)
            });
        }
        _onMouseLeave(e) {
            this.lastMouseLeaveTime = (new Date()).getTime();
            this.viewController.emitMouseLeave({
                event: e,
                target: null
            });
        }
        _onMouseUp(e) {
            this.viewController.emitMouseUp({
                event: e,
                target: this._createMouseTarget(e, true)
            });
        }
        _onMouseDown(e) {
            const t = this._createMouseTarget(e, true);
            const targetIsContent = (t.type === 6 /* CONTENT_TEXT */ || t.type === 7 /* CONTENT_EMPTY */);
            const targetIsGutter = (t.type === 2 /* GUTTER_GLYPH_MARGIN */ || t.type === 3 /* GUTTER_LINE_NUMBERS */ || t.type === 4 /* GUTTER_LINE_DECORATIONS */);
            const targetIsLineNumbers = (t.type === 3 /* GUTTER_LINE_NUMBERS */);
            const selectOnLineNumbers = this._context.configuration.editor.viewInfo.selectOnLineNumbers;
            const targetIsViewZone = (t.type === 8 /* CONTENT_VIEW_ZONE */ || t.type === 5 /* GUTTER_VIEW_ZONE */);
            const targetIsWidget = (t.type === 9 /* CONTENT_WIDGET */);
            let shouldHandle = e.leftButton || e.middleButton;
            if (platform.isMacintosh && e.leftButton && e.ctrlKey) {
                shouldHandle = false;
            }
            const focus = () => {
                // In IE11, if the focus is in the browser's address bar and
                // then you click in the editor, calling preventDefault()
                // will not move focus properly (focus remains the address bar)
                if (browser.isIE && !this._isFocused) {
                    this._asyncFocus.schedule();
                }
                else {
                    e.preventDefault();
                    this.viewHelper.focusTextArea();
                }
            };
            if (shouldHandle && (targetIsContent || (targetIsLineNumbers && selectOnLineNumbers))) {
                focus();
                this._mouseDownOperation.start(t.type, e);
            }
            else if (targetIsGutter) {
                // Do not steal focus
                e.preventDefault();
            }
            else if (targetIsViewZone) {
                const viewZoneData = t.detail;
                if (this.viewHelper.shouldSuppressMouseDownOnViewZone(viewZoneData.viewZoneId)) {
                    focus();
                    this._mouseDownOperation.start(t.type, e);
                    e.preventDefault();
                }
            }
            else if (targetIsWidget && this.viewHelper.shouldSuppressMouseDownOnWidget(t.detail)) {
                focus();
                e.preventDefault();
            }
            this.viewController.emitMouseDown({
                event: e,
                target: t
            });
        }
        _onMouseWheel(e) {
            this.viewController.emitMouseWheel(e);
        }
    }
    MouseHandler.MOUSE_MOVE_MINIMUM_TIME = 100; // ms
    exports.MouseHandler = MouseHandler;
    class MouseDownOperation extends lifecycle_1.Disposable {
        constructor(context, viewController, viewHelper, createMouseTarget, getMouseColumn) {
            super();
            this._context = context;
            this._viewController = viewController;
            this._viewHelper = viewHelper;
            this._createMouseTarget = createMouseTarget;
            this._getMouseColumn = getMouseColumn;
            this._mouseMoveMonitor = this._register(new editorDom_1.GlobalEditorMouseMoveMonitor(this._viewHelper.viewDomNode));
            this._onScrollTimeout = this._register(new async_1.TimeoutTimer());
            this._mouseState = new MouseDownState();
            this._currentSelection = new selection_1.Selection(1, 1, 1, 1);
            this._isActive = false;
            this._lastMouseEvent = null;
        }
        dispose() {
            super.dispose();
        }
        isActive() {
            return this._isActive;
        }
        _onMouseDownThenMove(e) {
            this._lastMouseEvent = e;
            this._mouseState.setModifiers(e);
            const position = this._findMousePosition(e, true);
            if (!position) {
                // Ignoring because position is unknown
                return;
            }
            if (this._mouseState.isDragAndDrop) {
                this._viewController.emitMouseDrag({
                    event: e,
                    target: position
                });
            }
            else {
                this._dispatchMouse(position, true);
            }
        }
        start(targetType, e) {
            this._lastMouseEvent = e;
            this._mouseState.setStartedOnLineNumbers(targetType === 3 /* GUTTER_LINE_NUMBERS */);
            this._mouseState.setStartButtons(e);
            this._mouseState.setModifiers(e);
            const position = this._findMousePosition(e, true);
            if (!position || !position.position) {
                // Ignoring because position is unknown
                return;
            }
            this._mouseState.trySetCount(e.detail, position.position);
            // Overwrite the detail of the MouseEvent, as it will be sent out in an event and contributions might rely on it.
            e.detail = this._mouseState.count;
            if (!this._context.configuration.editor.readOnly
                && this._context.configuration.editor.dragAndDrop
                && !this._mouseState.altKey // we don't support multiple mouse
                && e.detail < 2 // only single click on a selection can work
                && !this._isActive // the mouse is not down yet
                && !this._currentSelection.isEmpty() // we don't drag single cursor
                && (position.type === 6 /* CONTENT_TEXT */) // single click on text
                && position.position && this._currentSelection.containsPosition(position.position) // single click on a selection
            ) {
                this._mouseState.isDragAndDrop = true;
                this._isActive = true;
                this._mouseMoveMonitor.startMonitoring(createMouseMoveEventMerger(null), (e) => this._onMouseDownThenMove(e), () => {
                    const position = this._findMousePosition(this._lastMouseEvent, true);
                    this._viewController.emitMouseDrop({
                        event: this._lastMouseEvent,
                        target: (position ? this._createMouseTarget(this._lastMouseEvent, true) : null) // Ignoring because position is unknown, e.g., Content View Zone
                    });
                    this._stop();
                });
                return;
            }
            this._mouseState.isDragAndDrop = false;
            this._dispatchMouse(position, e.shiftKey);
            if (!this._isActive) {
                this._isActive = true;
                this._mouseMoveMonitor.startMonitoring(createMouseMoveEventMerger(null), (e) => this._onMouseDownThenMove(e), () => this._stop());
            }
        }
        _stop() {
            this._isActive = false;
            this._onScrollTimeout.cancel();
        }
        onScrollChanged() {
            if (!this._isActive) {
                return;
            }
            this._onScrollTimeout.setIfNotSet(() => {
                if (!this._lastMouseEvent) {
                    return;
                }
                const position = this._findMousePosition(this._lastMouseEvent, false);
                if (!position) {
                    // Ignoring because position is unknown
                    return;
                }
                if (this._mouseState.isDragAndDrop) {
                    // Ignoring because users are dragging the text
                    return;
                }
                this._dispatchMouse(position, true);
            }, 10);
        }
        onCursorStateChanged(e) {
            this._currentSelection = e.selections[0];
        }
        _getPositionOutsideEditor(e) {
            const editorContent = e.editorPos;
            const model = this._context.model;
            const viewLayout = this._context.viewLayout;
            const mouseColumn = this._getMouseColumn(e);
            if (e.posy < editorContent.y) {
                const verticalOffset = Math.max(viewLayout.getCurrentScrollTop() - (editorContent.y - e.posy), 0);
                const viewZoneData = mouseTarget_1.HitTestContext.getZoneAtCoord(this._context, verticalOffset);
                if (viewZoneData) {
                    const newPosition = this._helpPositionJumpOverViewZone(viewZoneData);
                    if (newPosition) {
                        return new mouseTarget_1.MouseTarget(null, 13 /* OUTSIDE_EDITOR */, mouseColumn, newPosition);
                    }
                }
                const aboveLineNumber = viewLayout.getLineNumberAtVerticalOffset(verticalOffset);
                return new mouseTarget_1.MouseTarget(null, 13 /* OUTSIDE_EDITOR */, mouseColumn, new position_1.Position(aboveLineNumber, 1));
            }
            if (e.posy > editorContent.y + editorContent.height) {
                const verticalOffset = viewLayout.getCurrentScrollTop() + (e.posy - editorContent.y);
                const viewZoneData = mouseTarget_1.HitTestContext.getZoneAtCoord(this._context, verticalOffset);
                if (viewZoneData) {
                    const newPosition = this._helpPositionJumpOverViewZone(viewZoneData);
                    if (newPosition) {
                        return new mouseTarget_1.MouseTarget(null, 13 /* OUTSIDE_EDITOR */, mouseColumn, newPosition);
                    }
                }
                const belowLineNumber = viewLayout.getLineNumberAtVerticalOffset(verticalOffset);
                return new mouseTarget_1.MouseTarget(null, 13 /* OUTSIDE_EDITOR */, mouseColumn, new position_1.Position(belowLineNumber, model.getLineMaxColumn(belowLineNumber)));
            }
            const possibleLineNumber = viewLayout.getLineNumberAtVerticalOffset(viewLayout.getCurrentScrollTop() + (e.posy - editorContent.y));
            if (e.posx < editorContent.x) {
                return new mouseTarget_1.MouseTarget(null, 13 /* OUTSIDE_EDITOR */, mouseColumn, new position_1.Position(possibleLineNumber, 1));
            }
            if (e.posx > editorContent.x + editorContent.width) {
                return new mouseTarget_1.MouseTarget(null, 13 /* OUTSIDE_EDITOR */, mouseColumn, new position_1.Position(possibleLineNumber, model.getLineMaxColumn(possibleLineNumber)));
            }
            return null;
        }
        _findMousePosition(e, testEventTarget) {
            const positionOutsideEditor = this._getPositionOutsideEditor(e);
            if (positionOutsideEditor) {
                return positionOutsideEditor;
            }
            const t = this._createMouseTarget(e, testEventTarget);
            const hintedPosition = t.position;
            if (!hintedPosition) {
                return null;
            }
            if (t.type === 8 /* CONTENT_VIEW_ZONE */ || t.type === 5 /* GUTTER_VIEW_ZONE */) {
                const newPosition = this._helpPositionJumpOverViewZone(t.detail);
                if (newPosition) {
                    return new mouseTarget_1.MouseTarget(t.element, t.type, t.mouseColumn, newPosition, null, t.detail);
                }
            }
            return t;
        }
        _helpPositionJumpOverViewZone(viewZoneData) {
            // Force position on view zones to go above or below depending on where selection started from
            const selectionStart = new position_1.Position(this._currentSelection.selectionStartLineNumber, this._currentSelection.selectionStartColumn);
            const positionBefore = viewZoneData.positionBefore;
            const positionAfter = viewZoneData.positionAfter;
            if (positionBefore && positionAfter) {
                if (positionBefore.isBefore(selectionStart)) {
                    return positionBefore;
                }
                else {
                    return positionAfter;
                }
            }
            return null;
        }
        _dispatchMouse(position, inSelectionMode) {
            if (!position.position) {
                return;
            }
            this._viewController.dispatchMouse({
                position: position.position,
                mouseColumn: position.mouseColumn,
                startedOnLineNumbers: this._mouseState.startedOnLineNumbers,
                inSelectionMode: inSelectionMode,
                mouseDownCount: this._mouseState.count,
                altKey: this._mouseState.altKey,
                ctrlKey: this._mouseState.ctrlKey,
                metaKey: this._mouseState.metaKey,
                shiftKey: this._mouseState.shiftKey,
                leftButton: this._mouseState.leftButton,
                middleButton: this._mouseState.middleButton,
            });
        }
    }
    class MouseDownState {
        constructor() {
            this._altKey = false;
            this._ctrlKey = false;
            this._metaKey = false;
            this._shiftKey = false;
            this._leftButton = false;
            this._middleButton = false;
            this._startedOnLineNumbers = false;
            this._lastMouseDownPosition = null;
            this._lastMouseDownPositionEqualCount = 0;
            this._lastMouseDownCount = 0;
            this._lastSetMouseDownCountTime = 0;
            this.isDragAndDrop = false;
        }
        get altKey() { return this._altKey; }
        get ctrlKey() { return this._ctrlKey; }
        get metaKey() { return this._metaKey; }
        get shiftKey() { return this._shiftKey; }
        get leftButton() { return this._leftButton; }
        get middleButton() { return this._middleButton; }
        get startedOnLineNumbers() { return this._startedOnLineNumbers; }
        get count() {
            return this._lastMouseDownCount;
        }
        setModifiers(source) {
            this._altKey = source.altKey;
            this._ctrlKey = source.ctrlKey;
            this._metaKey = source.metaKey;
            this._shiftKey = source.shiftKey;
        }
        setStartButtons(source) {
            this._leftButton = source.leftButton;
            this._middleButton = source.middleButton;
        }
        setStartedOnLineNumbers(startedOnLineNumbers) {
            this._startedOnLineNumbers = startedOnLineNumbers;
        }
        trySetCount(setMouseDownCount, newMouseDownPosition) {
            // a. Invalidate multiple clicking if too much time has passed (will be hit by IE because the detail field of mouse events contains garbage in IE10)
            const currentTime = (new Date()).getTime();
            if (currentTime - this._lastSetMouseDownCountTime > MouseDownState.CLEAR_MOUSE_DOWN_COUNT_TIME) {
                setMouseDownCount = 1;
            }
            this._lastSetMouseDownCountTime = currentTime;
            // b. Ensure that we don't jump from single click to triple click in one go (will be hit by IE because the detail field of mouse events contains garbage in IE10)
            if (setMouseDownCount > this._lastMouseDownCount + 1) {
                setMouseDownCount = this._lastMouseDownCount + 1;
            }
            // c. Invalidate multiple clicking if the logical position is different
            if (this._lastMouseDownPosition && this._lastMouseDownPosition.equals(newMouseDownPosition)) {
                this._lastMouseDownPositionEqualCount++;
            }
            else {
                this._lastMouseDownPositionEqualCount = 1;
            }
            this._lastMouseDownPosition = newMouseDownPosition;
            // Finally set the lastMouseDownCount
            this._lastMouseDownCount = Math.min(setMouseDownCount, this._lastMouseDownPositionEqualCount);
        }
    }
    MouseDownState.CLEAR_MOUSE_DOWN_COUNT_TIME = 400; // ms
});
//# sourceMappingURL=mouseHandler.js.map