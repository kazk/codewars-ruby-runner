# BUILD-USING:    docker build -t codewars/runner-ruby .
# TEST-USING:     docker run --rm -i -t --name=test-runner-ruby --entrypoint=/bin/bash codewars/runner-ruby -s
# RUN-USING:      docker run --rm --name=runner-ruby codewars/runner-ruby --help
# EXAMPLE USAGE:  docker run --rm codewars/runner-ruby run -l ruby -c "puts 1+1"

# Pull base image.
FROM codewars/base-runner

#Install ruby
# skip installing gem documentation
RUN mkdir -p /usr/local/etc \
	&& { \
		echo 'install: --no-document'; \
		echo 'update: --no-document'; \
	} >> /usr/local/etc/gemrc

ENV RUBY_MAJOR 2.3
ENV RUBY_VERSION 2.3.0
ENV RUBY_DOWNLOAD_SHA256 ba5ba60e5f1aa21b4ef8e9bf35b9ddb57286cb546aac4b5a28c71f459467e507
ENV RUBYGEMS_VERSION 2.6.1

# some of ruby's build scripts are written in ruby
# we purge this later to make sure our final image uses what we just built
RUN set -ex \
	&& buildDeps=' \
		bison \
		libgdbm-dev \
		ruby \
	' \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends $buildDeps \
	&& rm -rf /var/lib/apt/lists/* \
	&& curl -fSL -o ruby.tar.gz "http://cache.ruby-lang.org/pub/ruby/$RUBY_MAJOR/ruby-$RUBY_VERSION.tar.gz" \
	&& echo "$RUBY_DOWNLOAD_SHA256 *ruby.tar.gz" | sha256sum -c - \
	&& mkdir -p /usr/src/ruby \
	&& tar -xzf ruby.tar.gz -C /usr/src/ruby --strip-components=1 \
	&& rm ruby.tar.gz \
	&& cd /usr/src/ruby \
	&& { echo '#define ENABLE_PATH_CHECK 0'; echo; cat file.c; } > file.c.new && mv file.c.new file.c \
	&& autoconf \
	&& ./configure --disable-install-doc \
	&& make -j"$(nproc)" \
	&& make install \
	&& apt-get purge -y --auto-remove $buildDeps \
	&& gem update --system $RUBYGEMS_VERSION \
	&& rm -r /usr/src/ruby

ENV BUNDLER_VERSION 1.11.2

RUN gem install bundler --version "$BUNDLER_VERSION"

# install things globally, for great justice
# and don't create ".bundle" in all our apps
ENV GEM_HOME /usr/local/bundle
ENV BUNDLE_PATH="$GEM_HOME" \
	BUNDLE_BIN="$GEM_HOME/bin" \
	BUNDLE_SILENCE_ROOT_WARNING=1 \
	BUNDLE_APP_CONFIG="$GEM_HOME"
ENV PATH $BUNDLE_BIN:$PATH
RUN mkdir -p "$GEM_HOME" "$BUNDLE_BIN" \
	&& chmod 777 "$GEM_HOME" "$BUNDLE_BIN"

# RSpec Gems for Testing
RUN gem install rspec --no-ri --no-rdoc
RUN gem install rspec-its --no-ri --no-rdoc
RUN gem install rspec-rails --no-ri --no-rdoc

# needed for nokogiri
RUN apt-get -y install zlib1g-dev

# Install additional gems
RUN gem install amqp --no-ri --no-rdoc
RUN gem install bunny --no-ri --no-rdoc
RUN gem install capybara --no-ri --no-rdoc
RUN gem install celluloid --no-ri --no-rdoc
RUN gem install concerning --no-ri --no-rdoc
RUN gem install concurrent-ruby --no-ri --no-rdoc
RUN gem install connection_pool --no-ri --no-rdoc
RUN gem install couchrest --no-ri --no-rdoc
RUN gem install couch_potato --no-ri --no-rdoc
RUN gem install elasticsearch --no-ri --no-rdoc
RUN gem install eventmachine --no-ri --no-rdoc
RUN gem install faraday --no-ri --no-rdoc
RUN gem install jbuilder --no-ri --no-rdoc
RUN gem install jwt --no-ri --no-rdoc
RUN gem install hashie --no-ri --no-rdoc
RUN gem install httparty --no-ri --no-rdoc
RUN gem install factory_girl --no-ri --no-rdoc
RUN gem install faker --no-ri --no-rdoc
RUN gem install ffi-rzmq --no-ri --no-rdoc
RUN gem install googlecharts --no-ri --no-rdoc
RUN gem install pg --no-ri --no-rdoc
RUN gem install pry --no-ri --no-rdoc
RUN gem install mock_redis --no-ri --no-rdoc
RUN gem install mongo --no-ri --no-rdoc
RUN gem install mongoid --no-ri --no-rdoc
RUN gem install net-ssh --no-ri --no-rdoc
RUN gem install nokogiri --no-ri --no-rdoc
RUN gem install rails --no-ri --no-rdoc
RUN gem install redis --no-ri --no-rdoc
RUN gem install ruby-graphviz --no-ri --no-rdoc
RUN gem install sequel --no-ri --no-rdoc
RUN gem install sinatra --no-ri --no-rdoc
RUN gem install timecop --no-ri --no-rdoc
RUN gem install timers --no-ri --no-rdoc
RUN gem install webmock --no-ri --no-rdoc
RUN gem install sciruby --no-ri --no-rdoc
# reduced selection of sciruby-full gems since all needed build dependencies are not installed
RUN gem install ai4r --no-ri --no-rdoc
RUN gem install algorithms --no-ri --no-rdoc
RUN gem install awesome_print --no-ri --no-rdoc
RUN gem install classifier --no-ri --no-rdoc
RUN gem install daru --no-ri --no-rdoc
RUN gem install darwinning --no-ri --no-rdoc
RUN gem install decisiontree --no-ri --no-rdoc
RUN gem install distribution --no-ri --no-rdoc
RUN gem install gga4r --no-ri --no-rdoc
RUN gem install gimuby --no-ri --no-rdoc
RUN gem install hamster --no-ri --no-rdoc
RUN gem install histogram --no-ri --no-rdoc
RUN gem install measurable --no-ri --no-rdoc
RUN gem install mikon --no-ri --no-rdoc
RUN gem install minimization --no-ri --no-rdoc
RUN gem install narray --no-ri --no-rdoc
RUN gem install ruby-fann --no-ri --no-rdoc
RUN gem install statsample --no-ri --no-rdoc
RUN gem install statsample-glm --no-ri --no-rdoc
RUN gem install statsample-timeseries --no-ri --no-rdoc
RUN gem install stuff-classifier --no-ri --no-rdoc
RUN gem install symbolic --no-ri --no-rdoc
RUN gem install unit --no-ri --no-rdoc

RUN gem install chronic --no-ri --no-rdoc

# partner packages
RUN gem install ably --no-ri --no-rdoc

USER codewarrior

# Sample Database
# http://www.postgresqltutorial.com/postgresql-sample-database/#

ADD sample_data /runner/sample_data
RUN /usr/lib/postgresql/9.6/bin/pg_ctl -w start \
    && createdb -U codewarrior spec \
    && createdb -U codewarrior dvdrental \
    && pg_restore -U codewarrior -d dvdrental -v /runner/sample_data/dvdrental.tar || true \
#    && psql -f /runner/sample_data/mlb-samples.sql sports codewarrior \
    && psql -l \
    && /usr/lib/postgresql/9.6/bin/pg_ctl -w stop

USER root

# install the tcsh shell
RUN apt-get update && apt-get -y install csh tcsh

# Install extra shell packages
RUN apt-get update && apt-get -y install mlocate bc

# allow codewarrior to install gems
RUN chown codewarrior /usr/local/bundle

WORKDIR /runner
COPY package.json /runner/package.json
RUN npm install --only=prod
# TODO: separate test and remove this
RUN npm install --only=dev

RUN ln -s /home/codewarrior /workspace

COPY . /runner

# Run the test suite to make sure this thing works
USER codewarrior
# Set environment variables
ENV USER=codewarrior HOME=/home/codewarrior

RUN NODE_ENV=test mocha -t 5000
#RUN mocha -t 5000 test/runners/ruby_spec.js
#RUN mocha -t 5000 test/runners/sql_spec.js
#RUN mocha -t 5000 test/runners/shell_spec.js
#RUN sh /runner/lib/cleanup.sh
RUN ["/bin/bash", "-c", "find /home/codewarrior -mindepth 1 -maxdepth 1 -exec rm -rf '{}';"]

#timeout is a fallback in case an error with node
#prevents it from exiting properly
ENTRYPOINT ["timeout", "15", "node"]
