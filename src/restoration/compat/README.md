# Restoration Compatibility Stubs

These modules provide stub implementations for Anthropic-internal packages
that are not available in this open-source snapshot. They export the minimum
interface needed to prevent import-time crashes.

All stubs throw clear "unavailable in restored snapshot" errors if their
functionality is actually invoked at runtime.
