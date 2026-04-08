// Rig editing issue fixes

// SHARED_SOURCE_RULES update to include 'trip'
const SHARED_SOURCE_RULES = [
    'source1',
    'source2',
    'trip', // Added trip
    // existing rules...
];

// Modify currentSourceForPoseSlot to resolve shared sources
function currentSourceForPoseSlot(pose, slot) {
    // Logic to resolve shared sources correctly
    // Your existing code... 
}

// Change clearPreviewSrc to use CLEAR_SENTINEL for all poses
function clearPreviewSrc(pose) {
    // Use CLEAR_SENTINEL consistently
    pose.source = CLEAR_SENTINEL;
}

// Modify normalizePoseFromIdle to scale/anchor without copying positions
function normalizePoseFromIdle(pose) {
    // Only scale or anchor
    // Your existing code...
}

// Ensure refreshGamePreview uses currentSourceForPoseSlot
function refreshGamePreview() {
    const source = currentSourceForPoseSlot(currentPose, currentSlot);
    // Logic to refresh preview...
}

// Confirm saveRect keeps edits isolated to current pose
function saveRect(rect) {
    // Logic to save rect ensuring isolation
} 
