# Zenodo release archiving

Use Zenodo's native GitHub integration for `mariomarcolongo/hypermandala`. It archives published GitHub releases; normal commits and pull-request merges do not create a DOI. No additional GitHub Actions workflow or Zenodo API secret is needed.

## One-time setup

1. In Zenodo's GitHub settings, sync repositories and enable only `mariomarcolongo/hypermandala`.
2. Retain the project's own DOI series. Do not create a parallel manual archive for the same releases.
3. Existing releases are not automatically backfilled when the switch is enabled. Do not delete or recreate old releases or tags to force ingestion.

## Release checklist

1. Complete the repository's normal validation and review. Check the citation title, creator, ORCID and licence references against the released source.
2. Publish an intentional versioned GitHub release containing `CITATION.cff`. Do not make a release merely to claim a DOI.
3. Confirm that Zenodo reports successful processing. Inspect the public record, archived files, version, author metadata and licence before using the DOI.
4. Use the all-version DOI for the evolving project and the version DOI when identifying exact software used. Add badges only after the record exists.
5. Preserve third-party notices in the archive. Citation authorship does not replace source attribution or confer peer-review status.

## First release

No versioned GitHub release existed when this guide was prepared. Select and validate an explicit baseline before publishing the first release. The live website may subsequently differ from that archived version.

The citation uses the repository's existing AGPL-3.0 licence classification. Preserve its licence text and all reference and attribution information; do not infer a different licence grant.

## Documentation

- [Enable a repository](https://help.zenodo.org/docs/github/enable-repository/)
- [Archive a software release](https://help.zenodo.org/docs/github/archive-software/github-upload/)
- [Describe software with CITATION.cff](https://help.zenodo.org/docs/github/describe-software/citation-file/)
