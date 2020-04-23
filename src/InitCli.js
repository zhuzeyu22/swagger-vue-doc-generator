const ArgumentParser = require('argparse').ArgumentParser,
      http             = require('http'),
      fs             = require('fs'),
      path           = require('path'),
      DocGenerator   = require('./DocGenerator'),
      SwaggerParser  = require('./SwaggerParser'),
      GenerateApi    = require('./GenerateApi')

/**
 * @class InitCli
 * Init command line interface options
 *
 * @property {ArgumentParser} parser Command line arguments parser
 * @property {Object} arguments Arguments from cli
 * @property {String} workingDir Working directory
 */
class InitCli {
  /**
   *
   * @param {String} version Command script version
   * @param {String} description Command script description
   */
  constructor (version, description) {
    this.parser = new ArgumentParser({
      version    : version,
      description: description,
      addHelp    : true
    })

    this.workingDir = process.cwd()

    this.arguments = {}

    this._defaultArguments()
  }

  /**
   * Init default cli arguments
   *
   * @private
   */
  _defaultArguments () {
    this.addArgument(
      ['-s', '--source'],
      {
        help    : 'Source swagger file destination',
        required: true
      }
    )

    this.addArgument(
      ['-f', '--flag-version'],
      {
        help        : 'Set swagger version (2.0 or openapi). 2.0 only supported | [optional]. Default value is 2.0',
        required    : false,
        defaultValue: '2.0'
      }
    )

    this.addArgument(
      ['-m', '--moduleName'],
      {
        help    : 'Swagger generator module name',
        required: true
      }
    )

    this.addArgument(
      ['-c', '--className'],
      {
        help        : 'Swagger generator class name',
        defaultValue: 'API',
      }
    )

    this.addArgument(
      ['-d', '--destination'],
      {
        help    : 'Destination for output generate client ',
        required: true
      }
    )

    this.addArgument(
      ['-n', '--package-name'],
      {
        help        : 'Package name',
        defaultValue: 'vue-swagger-api'
      }
    )

    this.addArgument(
      ['--package-version'],
      {
        help        : 'Package version',
        defaultValue: '0.2'
      }
    )

    this.addArgument(
      ['-p', '--repo-path'],
      {
        help: 'Path to repository for auto detect version'
      }
    )

    this.addArgument(
      ['-t', '--tag-command'],
      {
        help        : 'Command for get tags list',
        defaultValue: 'git tag -l'
      }
    )

    this.addArgument(
      ['-u', '--url'],
      {
        help        : 'Fecth swagger file from URL',
      }
    )

  }

  /**
   * Add options for documentation generator
   */
  addDocumentGeneratorArguments () {
    this.addArgument(
      ['--doc-path'],
      {
        help        : 'Destination for methods descriptions',
        required    : false,
        defaultValue: 'docs',
      }
    )

    this.addArgument(
      ['--model-path'],
      {
        help        : 'Destination for models description',
        required    : false,
        defaultValue: 'docs/models',
      }
    )

    this.parser.addArgument(
      ['--html'],
      {
        help  : 'Generate in Html format',
        action: 'storeTrue'
      }
    )

    this.parser.addArgument(
      ['--md'],
      {
        help  : 'Generate in md format',
        action: 'storeFalse'
      }
    )
  }

  /**
   * Add argument definition
   *
   * @param {Array.<String>} command Argument definition
   * @param {Object} options Argument options
   */
  addArgument (command, options) {
    this.parser.addArgument(command, options)
  }

  /*
   * Fecth swagger file from URL
  */
  async fectchFile(){
    await http.get(this.arguments.url, response=>{
      var json = ''
      response.on('data', (data => {
        json += data
      })) 
      response.on('end', () => {
          fs.writeFileSync(this.arguments.source, json)
      })
    })
  }

  /**
   * Generate api file
   */
  async generateApi () {

    this.parse()
    this.arguments.url !== undefined ? await this.fectchFile() : null

    let jsonFile  = fs.existsSync(this.arguments.source) ? this.arguments.source : path.join(process.cwd(), this.arguments.source),
        generator = new GenerateApi(jsonFile, {
          outFile   : this.arguments.destination,
          moduleName: this.arguments.moduleName,
          className : this.arguments.className,
        })

    generator.generate()
  }

  _getDocOutFormat () {
    if (this.arguments.md) {
      return DocGenerator.Markdown
    }

    return DocGenerator.HTML
  }

  generateDoc () {
    this.addDocumentGeneratorArguments()

    this.parse()

    let jsonFile = this._getJsonFile(),
        docs     = new DocGenerator(this._getDocOutFormat(), {
          inputJson     : jsonFile,
          moduleName    : this.arguments.moduleName,
          modelPath     : this.arguments.model_path,
          docsPath      : this.arguments.doc_path,
          className     : this.arguments.className,
          packageName   : this.arguments.package_name,
          packageVersion: this.arguments.package_version,
          destination   : this.arguments.destination
        }, this.arguments.flag_version)

    docs.generate()
  }

  /**
   * Get json file path
   *
   * @return {String}
   * @private
   */
  _getJsonFile () {
    return fs.existsSync(this.parser.source) ? this.arguments.source : path.join(process.cwd(), this.arguments.source)
  }

  /**
   * Parse cli options & arguments
   */
  parse () {
    this.arguments = this.parser.parseArgs()

    return this.arguments
  }
}

module.exports = InitCli